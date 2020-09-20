/*
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 */

import { fromJS } from 'immutable';
import { ToolingModelService, ToolingModelJson } from './toolingModelService';
import { VscodeMessageService } from './message/vscodeMessageService';
import { IMessageService } from './message/iMessageService';
import { BehaviorSubject } from 'rxjs';
import { MessageType, SoqlEditorEvent } from './message/soqlEditorEvent';

describe('Tooling Model Service', () => {
  let modelService: ToolingModelService;
  let messageService: IMessageService;
  let mockField1 = 'field1';
  let mockField2 = 'field2';
  let mockSobject = 'sObject1';
  let query: ToolingModelJson;
  let accountQuery = {
    sObject: 'Account',
    fields: [],
    errors: []
  };
  const soqlEditorEvent = {
    type: MessageType.TEXT_SOQL_CHANGED,
    payload: accountQuery
  } as SoqlEditorEvent;

  function checkForEmptyModel() {
    let toolingModel = modelService.getModel().toJS();
    expect(toolingModel.sObject).toEqual('');
    expect(toolingModel.fields.length).toBe(0);
  }

  beforeEach(() => {
    messageService = new VscodeMessageService();
    messageService.setState = jest.fn();
    messageService.sendMessage = jest.fn();
    messageService.messagesToUI = new BehaviorSubject(
      fromJS(ToolingModelService.toolingModelTemplate)
    );
    modelService = new ToolingModelService(messageService);

    checkForEmptyModel();
    query = undefined;

    modelService.query.subscribe((val) => {
      query = val;
    });
  });

  it('can set an SObject selection', () => {
    modelService.setSObject(mockSobject);

    expect(query!.sObject).toBe(mockSobject);
  });

  it('can Add, Delete Fields and saves changes', () => {
    expect(messageService.setState).toHaveBeenCalledTimes(1);

    expect(query!.fields.length).toEqual(0);

    // Add
    modelService.addField(mockField1);
    modelService.addField(mockField2);
    expect(query!.fields.length).toBe(2);
    expect(query!.fields).toContain(mockField1);
    expect(query!.fields).toContain(mockField2);
    // Delete
    modelService.removeField(mockField1);
    expect(query!.fields.length).toBe(1);
    expect(query!.fields).toContain(mockField2);
    // verify saves
    expect(messageService.setState).toHaveBeenCalledTimes(4);
  });

  it('should handle error turning immutable model into js', () => {
    // notbing
    checkForEmptyModel();
    const soqlEvent = { ...soqlEditorEvent };
    (soqlEvent.payload as ToolingModelJson).fields = ['Hey', 'Joe'];
    // soqlEvent.payload = (new Error('boom') as unknown) as string;
    (messageService.messagesToUI as BehaviorSubject<SoqlEditorEvent>).next(
      soqlEvent
    );
    expect(query!.fields.length).toBe(2);
  });

  it('should handle SOQL_TEXT_CHANGED event but not others', () => {
    // notbing
    checkForEmptyModel();
    const soqlEvent = { ...soqlEditorEvent };
    (soqlEvent.payload as ToolingModelJson).fields = ['Hey', 'Joe'];
    (messageService.messagesToUI as BehaviorSubject<SoqlEditorEvent>).next(
      soqlEvent
    );
    expect(query!.fields.length).toBe(2);
    soqlEvent.type = MessageType.SOBJECTS_RESPONSE;
    (soqlEvent.payload as ToolingModelJson).fields = ['What'];
    (messageService.messagesToUI as BehaviorSubject<SoqlEditorEvent>).next(
      soqlEvent
    );
    // Fields should not change
    expect(query!.fields.length).toBe(2);
  });

  it('should send message when ui changes the query', () => {
    expect(messageService.sendMessage).not.toHaveBeenCalled();
    // Add
    modelService.addField(mockField1);
    expect(messageService.sendMessage).toHaveBeenCalled();
  });

  it('should restore state', () => {
    expect(query!.sObject).toEqual('');
    jest.spyOn(messageService, 'getState').mockReturnValue(accountQuery);
    modelService.restoreViewState();
    expect(query!.sObject).toEqual(accountQuery.sObject);
  });
});
