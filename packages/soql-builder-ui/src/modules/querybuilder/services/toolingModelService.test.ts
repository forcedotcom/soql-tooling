/*
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 */

import { ToolingModelService, ToolingModelJson } from './toolingModelService';
import { VscodeMessageService } from './message/vscodeMessageService';
import { IMessageService } from './message/iMessageService';
import { getWindow, getVscode } from './globals';
import { MessageType } from './message/soqlEditorEvent';

describe('Tooling Model Service', () => {
  let modelService: ToolingModelService;
  let messageService: IMessageService;
  let mockField1 = 'field1';
  let mockField2 = 'field2';
  let mockSobject = 'sObject1';
  let query: ToolingModelJson;
  let window = getWindow();
  let vscode;

  function checkForEmptyModel() {
    let toolingModel = modelService.getModel().toJS();
    expect(toolingModel.sObject).toEqual('');
    expect(toolingModel.fields.length).toBe(0);
  }

  function postMessageFromVSCode(message) {
    const messageEvent = new MessageEvent('message', { data: message });
    window.dispatchEvent(messageEvent);
  }
  beforeEach(() => {
    messageService = new VscodeMessageService();
    messageService.setState = jest.fn();
    modelService = new ToolingModelService(messageService);
    vscode = getVscode();

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

  it('Receive SOQL Text from editor', () => {
    expect(query).toEqual({ sObject: '', fields: [] });

    const soqlText = 'Select Name1, Id1 from Account1';
    postMessageFromVSCode({
      type: MessageType.TEXT_SOQL_CHANGED,
      payload: soqlText
    });
    expect(query).toEqual({ sObject: 'Account1', fields: ['Name1', 'Id1'] });
  });
});
