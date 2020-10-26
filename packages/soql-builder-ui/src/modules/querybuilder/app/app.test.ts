/*
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 */

import { api, createElement } from 'lwc';
import App from 'querybuilder/app';
import {
  ToolingModelJson,
  ToolingModelService
} from '../services/toolingModelService';
import { ToolingSDK } from '../services/toolingSDK';
import {
  MessageType,
  SoqlEditorEvent
} from '../services/message/soqlEditorEvent';
import { BehaviorSubject, Observable } from 'rxjs';
import { MessageServiceFactory } from '../services/message/messageServiceFactory';
import { IMessageService } from '../services/message/iMessageService';
import { StandaloneMessageService } from '../services/message/standaloneMessageService';
import * as globals from '../services/globals';

class TestMessageService implements IMessageService {
  messagesToUI: Observable<SoqlEditorEvent> = new BehaviorSubject(
    ({} as unknown) as SoqlEditorEvent
  );
  sendMessage() {}
  setState() {}
  getState() {}
}

class TestApp extends App {
  query: ToolingModelJson = ToolingModelService.toolingModelTemplate;
  @api
  fields;
  @api
  isFromLoading = false;
  @api
  isFieldsLoading = false;
  @api
  hasUnrecoverableError = false;
}

describe('App should', () => {
  let app;
  let messageService;
  let loadSObjectDefinitionsSpy;
  let loadSObjectMetadataSpy;
  let accountQuery = 'SELECT Id FROM Account';
  let soqlEditorEvent = {
    type: MessageType.TEXT_SOQL_CHANGED,
    payload: accountQuery
  };
  let originalCreateFn;
  function createSoqlEditorEvent(queryOverride = accountQuery, eventOverride?) {
    const query = queryOverride;
    const event = { ...soqlEditorEvent, ...eventOverride };
    event.payload = query;
    return event;
  }
  beforeEach(() => {
    messageService = (new TestMessageService() as unknown) as StandaloneMessageService;
    originalCreateFn = MessageServiceFactory.create;
    MessageServiceFactory.create = () => {
      return messageService;
    };
    loadSObjectDefinitionsSpy = jest.spyOn(
      ToolingSDK.prototype,
      'loadSObjectDefinitions'
    );
    loadSObjectMetadataSpy = jest.spyOn(
      ToolingSDK.prototype,
      'loadSObjectMetatada'
    );
    spyOn(globals, 'getBodyClass').and.returnValue('vscode-dark');
    app = createElement('querybuilder-app', {
      is: TestApp
    });
    document.body.appendChild(app);
  });

  afterEach(() => {
    MessageServiceFactory.create = originalCreateFn;
    jest.clearAllMocks();
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it('display the app', () => {
    const from = app.shadowRoot.querySelectorAll('querybuilder-from');
    expect(from.length).toEqual(1);

    const fields = app.shadowRoot.querySelectorAll('querybuilder-fields');
    expect(fields.length).toEqual(1);

    const preview = app.shadowRoot.querySelectorAll(
      'querybuilder-query-preview'
    );
    expect(preview.length).toEqual(1);
  });

  it('block the query builder ui on unrecoverable error', async () => {
    let blockingElement = app.shadowRoot.querySelectorAll(
      '.unsupported-syntax'
    );
    expect(blockingElement.length).toBeFalsy();
    app.hasUnrecoverableError = true;
    return Promise.resolve().then(() => {
      blockingElement = app.shadowRoot.querySelectorAll('.unsupported-syntax');
      expect(blockingElement.length).toBeTruthy();
    });
  });

  it('not block the query builder ui on recoverable error', async () => {
    document.body.appendChild(app);
    let blockingElement = app.shadowRoot.querySelectorAll(
      '.unsupported-syntax'
    );
    expect(blockingElement.length).toBeFalsy();
    messageService.messagesToUI.next(
      createSoqlEditorEvent('SELECT FROM Account')
    );
    return Promise.resolve().then(() => {
      blockingElement = app.shadowRoot.querySelectorAll('.unsupported-syntax');
      expect(blockingElement.length).toBeFalsy();
    });
  });

  it('load sobjects immediately but not fields', () => {
    expect(app.isFromLoading).toEqual(true);
    expect(app.isFieldsLoading).toEqual(false);
  });

  it('block the query builder on unsupported syntax', async () => {
    let blockingElement = app.shadowRoot.querySelectorAll(
      '.unsupported-syntax'
    );
    expect(blockingElement.length).toBeFalsy();
    messageService.messagesToUI.next(
      createSoqlEditorEvent('SELECT Id FROM Account WHERE')
    );
    return Promise.resolve().then(() => {
      blockingElement = app.shadowRoot.querySelectorAll('.unsupported-syntax');
      expect(blockingElement.length).toBeTruthy();
    });
  });

  it('should load sobject definitions at creation', () => {
    expect(loadSObjectDefinitionsSpy).toHaveBeenCalled();
  });

  it('should load sobject metadata with valid query and stop loading when returned', async () => {
    expect(app.isFieldsLoading).toEqual(false);
    expect(loadSObjectMetadataSpy).not.toHaveBeenCalled();
    messageService.messagesToUI.next(createSoqlEditorEvent());
    expect(loadSObjectMetadataSpy).toHaveBeenCalled();
    expect(app.isFieldsLoading).toEqual(true);
    messageService.messagesToUI.next({
      type: MessageType.SOBJECT_METADATA_RESPONSE,
      payload: { fields: [] }
    });
    expect(app.isFieldsLoading).toEqual(false);
  });

  it('should request sobject metadata when sobject is changed', async () => {
    expect(loadSObjectMetadataSpy).not.toHaveBeenCalled();
    messageService.messagesToUI.next(createSoqlEditorEvent());
    expect(loadSObjectMetadataSpy.mock.calls.length).toEqual(1);
    messageService.messagesToUI.next(
      createSoqlEditorEvent('SELECT Id FROM Contact')
    );
    expect(loadSObjectMetadataSpy.mock.calls.length).toEqual(2);
    expect(loadSObjectMetadataSpy.mock.calls[1][0]).toEqual('Contact');
  });

  it('should clear fields when sobject is same but fields are empty', async () => {
    expect(loadSObjectMetadataSpy).not.toHaveBeenCalled();
    app.fields = [];
    messageService.messagesToUI.next(
      createSoqlEditorEvent('SELECT Id FROM Account')
    );
    expect(loadSObjectMetadataSpy.mock.calls.length).toEqual(1);
    expect(app.fields.length).toEqual(0);
  });

  it('should stop the loading flag when sobjects return', async () => {
    expect(app.isFromLoading).toEqual(true);
    messageService.messagesToUI.next({
      type: MessageType.SOBJECTS_RESPONSE,
      payload: ['Hey', 'Joe']
    });
    expect(app.isFromLoading).toEqual(false);
  });

  it('should send a runquery message to vs code with runquery event', async () => {
    const header = app.shadowRoot.querySelector('querybuilder-header');
    const postMessageSpy = jest.spyOn(messageService, 'sendMessage');
    header.dispatchEvent(new Event('runquery'));

    return Promise.resolve().then(() => {
      expect(postMessageSpy).toHaveBeenCalled();
      expect(postMessageSpy).toHaveBeenCalledWith({
        type: MessageType.RUN_SOQL_QUERY
      });
    });
  });

  it('send orderby message to vs code when orderby added', () => {
    const orderBy = app.shadowRoot.querySelector('querybuilder-order-by');
    const postMessageSpy = jest.spyOn(messageService, 'sendMessage');
    const eventPayload = {
      detail: {
        field: 'People are Strange'
      }
    };
    orderBy.dispatchEvent(new CustomEvent('orderbyselected', eventPayload));
    expect(postMessageSpy).toHaveBeenCalled();
    expect((postMessageSpy.mock.calls[0][0] as SoqlEditorEvent).type).toEqual(
      MessageType.UI_SOQL_CHANGED
    );
    expect(
      (postMessageSpy.mock.calls[0][0] as SoqlEditorEvent).payload
    ).toContain(eventPayload.detail.field);
  });

  it('send orderby message to vs code when orderby removed', () => {
    const orderBy = app.shadowRoot.querySelector('querybuilder-order-by');
    const postMessageSpy = jest.spyOn(messageService, 'sendMessage');
    const eventPayload = {
      detail: {
        field: 'People are Strange'
      }
    };
    orderBy.dispatchEvent(new CustomEvent('orderbyremoved', eventPayload));
    expect(postMessageSpy).toHaveBeenCalled();
    expect((postMessageSpy.mock.calls[0][0] as SoqlEditorEvent).type).toEqual(
      MessageType.UI_SOQL_CHANGED
    );
    expect(
      (postMessageSpy.mock.calls[0][0] as SoqlEditorEvent).payload
    ).not.toContain(eventPayload.detail.field);
  });

  it('send limit in message to vs code when limit changed', () => {
    const limit = app.shadowRoot.querySelector('querybuilder-limit');
    const postMessageSpy = jest.spyOn(messageService, 'sendMessage');
    const eventPayload = {
      detail: {
        limit: '11'
      }
    };
    limit.dispatchEvent(new CustomEvent('limitchanged', eventPayload));
    expect(postMessageSpy).toHaveBeenCalled();
    expect((postMessageSpy.mock.calls[0][0] as SoqlEditorEvent).type).toEqual(
      MessageType.UI_SOQL_CHANGED
    );
    expect(
      (postMessageSpy.mock.calls[0][0] as SoqlEditorEvent).payload
    ).toContain(eventPayload.detail.limit);
  });

  it('set the body class on the sub components', () => {

  });
});
