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

describe('Tooling Model Service', () => {
  let modelService: ToolingModelService;
  let messageService: IMessageService;
  let mockField1 = 'field1';
  let mockField2 = 'field2';
  let mockSobject = 'sObject1';
  let query: ToolingModelJson;

  function checkForEmptyModel() {
    let toolingModel = modelService.getModel().toJS();
    expect(toolingModel.sObject).toEqual('');
    expect(toolingModel.fields.length).toBe(0);
  }

  beforeEach(() => {
    messageService = new VscodeMessageService();
    messageService.setState = jest.fn();
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
});
