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
import { getVscode, getWindow } from './globals';

describe('Tooling Model Service', () => {
  let modelService: ToolingModelService;
  let messageService: IMessageService;
  let mockField1 = 'field1';
  let mockField2 = 'field2';
  let mockSobject = 'sObject1';
  let query: ToolingModelJson;
  let jimmyQuery = 'SELECT Hey, Joe from JimmyHendrixCatalog';
  let accountQuery = 'SELECT Id from Account';
  const soqlEditorEvent = {
    type: MessageType.TEXT_SOQL_CHANGED,
    payload: accountQuery
  } as SoqlEditorEvent;

  function checkForDefaultQuery() {
    let toolingModel = modelService.getModel().toJS();
    expect(toolingModel.sObject).toEqual('');
    expect(toolingModel.fields.length).toBe(0);
  }

  beforeEach(() => {
    messageService = new VscodeMessageService();
    messageService.setState = jest.fn();
    messageService.sendMessage = jest.fn();
    messageService.messagesToUI = new BehaviorSubject({
      type: MessageType.TEXT_SOQL_CHANGED,
      payload: ''
    });
    modelService = new ToolingModelService(messageService);

    checkForDefaultQuery();
    query = undefined;

    modelService.query.subscribe((val) => {
      query = val;
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('can set an SObject selection', () => {
    modelService.setSObject(mockSobject);

    expect(query!.sObject).toBe(mockSobject);
  });

  it('can Add, Delete Fields and saves changes', () => {
    (messageService.setState as jest.Mock).mockClear();
    expect(messageService.setState).toHaveBeenCalledTimes(0);
    query = ToolingModelService.toolingModelTemplate;

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
    expect(messageService.setState).toHaveBeenCalledTimes(3);
  });

  it('should handle error turning immutable model into js', () => {
    checkForDefaultQuery();
    const soqlEvent = { ...soqlEditorEvent };
    soqlEvent.payload = jimmyQuery;
    (messageService.messagesToUI as BehaviorSubject<SoqlEditorEvent>).next(
      soqlEvent
    );
    expect(query!.fields.length).toBe(2);
  });

  it('should handle SOQL_TEXT_CHANGED event but not others', () => {
    checkForDefaultQuery();
    const soqlEvent = { ...soqlEditorEvent };
    soqlEvent.payload = jimmyQuery;
    (messageService.messagesToUI as BehaviorSubject<SoqlEditorEvent>).next(
      soqlEvent
    );
    expect(query!.fields.length).toBe(2);
    soqlEvent.type = MessageType.SOBJECTS_RESPONSE;
    soqlEvent.payload = jimmyQuery.replace('Hey, Joe', 'What');
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
    const accountJson = {
      ...ToolingModelService.toolingModelTemplate
    };
    accountJson.sObject = 'Account';
    jest.spyOn(messageService, 'getState').mockReturnValue(accountJson);
    modelService.restoreViewState();
    expect(query!.sObject).toEqual(accountJson.sObject);
  });
  it('Receive SOQL Text from editor', () => {
    const soqlText = 'Select Name1, Id1 from Account1';
    const soqlEvent = { ...soqlEditorEvent };
    soqlEvent.payload = soqlText;
    (messageService.messagesToUI as BehaviorSubject<SoqlEditorEvent>).next(
      soqlEvent
    );
    expect(query.sObject).toEqual('Account1');
    expect(query.fields[0]).toEqual('Name1');
    expect(query.fields[1]).toEqual('Id1');
    expect(query.errors.length).toEqual(0);
    expect(query.unsupported.length).toEqual(0);
    //   sObject: 'Account1',
    //   fields: ['Name1', 'Id1'],
    //   errors: [],
    //   unsupported: []
    // });
  });
});
