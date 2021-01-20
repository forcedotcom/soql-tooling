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
import { BehaviorSubject } from 'rxjs';
import { MessageType, SoqlEditorEvent } from './message/soqlEditorEvent';
import { AndOr } from '../services/model';

describe('Tooling Model Service', () => {
  let modelService: ToolingModelService;
  let messageService: IMessageService;
  let mockField1 = 'field1';
  let mockField2 = 'field2';
  let mockSobject = 'sObject1';
  let mockOrderBy = { field: 'orderBy1', order: 'ASC', nulls: 'NULLS LAST' };
  const getMockWhereObj = () => {
    return {
      fieldCompareExpr: {
        condition: {
          field: { fieldName: 'Name' },
          operator: '=',
          compareValue: { type: 'STRING', value: "'pwt'" }
        },
        index: 0
      },
      andOr: 'AND'
    };
  };
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
    expect(toolingModel.originalSoqlStatement).toEqual('');
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

    modelService.UIModel.subscribe((val) => {
      query = val;
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('SOBJECTS', () => {
    it('can set an SObject selection', () => {
      modelService.setSObject(mockSobject);

      expect(query!.sObject).toBe(mockSobject);
    });
  });

  describe('FIELDS', () => {
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
  });

  describe('EVENTS', () => {
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
      expect(query!.originalSoqlStatement).toEqual(jimmyQuery);
      soqlEvent.type = MessageType.SOBJECTS_RESPONSE;
      soqlEvent.payload = jimmyQuery.replace('Hey, Joe', 'What');
      (messageService.messagesToUI as BehaviorSubject<SoqlEditorEvent>).next(
        soqlEvent
      );
      // query should not have changed
      expect(query!.fields.length).toBe(2);
      expect(query!.originalSoqlStatement).toEqual(jimmyQuery);
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
    });

    it('Ignore messages that have the exact same soql statement', () => {
      const spy = jest.fn();
      modelService.UIModel.subscribe(spy);
      // Behavior subject new subscriber gets called immediately with current value.
      expect(spy).toHaveBeenCalledTimes(1);
      (messageService.messagesToUI as BehaviorSubject<SoqlEditorEvent>).next(
        soqlEditorEvent
      );
      expect(spy).toHaveBeenCalledTimes(2);
      (messageService.messagesToUI as BehaviorSubject<SoqlEditorEvent>).next(
        soqlEditorEvent
      );
      expect(spy).toHaveBeenCalledTimes(2);
    });
  });

  describe('WHERE', () => {
    it('should ADD condition by index in the model', () => {
      (messageService.setState as jest.Mock).mockClear();
      expect(messageService.setState).toHaveBeenCalledTimes(0);
      query = ToolingModelService.toolingModelTemplate;

      expect(query!.where.conditions.length).toEqual(0);

      const mockWhereObj = getMockWhereObj();
      modelService.upsertWhereFieldExpr(mockWhereObj);

      expect(query!.where.conditions.length).toBe(1);
      expect(query!.where.conditions[0].condition).toEqual(
        mockWhereObj.fieldCompareExpr.condition
      );
      expect(query!.where.conditions[0].index).toEqual(
        mockWhereObj.fieldCompareExpr.index
      );
      // Does not duplicate
      modelService.upsertWhereFieldExpr(mockWhereObj);
      expect(query!.where.conditions.length).toBe(1);
      // Should allow multiple conditions to be set
      let newMock = getMockWhereObj();
      newMock.fieldCompareExpr.index = 1;
      modelService.upsertWhereFieldExpr(newMock);
      expect(query!.where.conditions.length).toBe(2);
    });

    it('should UPDATE the same condition by index', () => {
      (messageService.setState as jest.Mock).mockClear();
      expect(messageService.setState).toHaveBeenCalledTimes(0);
      query = ToolingModelService.toolingModelTemplate;

      expect(query!.where.conditions.length).toEqual(0);

      const mockWhereObj = getMockWhereObj();
      modelService.upsertWhereFieldExpr(mockWhereObj);

      expect(query!.where.conditions.length).toBe(1);
      expect(query!.where.conditions[0].condition).toEqual(
        mockWhereObj.fieldCompareExpr.condition
      );
      // update field on condition with same index
      const newField = 'marcs_bank_account';
      let newMock = getMockWhereObj();
      newMock.fieldCompareExpr.condition.field.fieldName = newField;
      modelService.upsertWhereFieldExpr(newMock);
      expect(query!.where.conditions.length).toBe(1);
      expect(query!.where.conditions[0].condition.field.fieldName).toContain(newField);
    });

    it('should DELETE condition by index', () => {
      (messageService.setState as jest.Mock).mockClear();
      expect(messageService.setState).toHaveBeenCalledTimes(0);
      query = ToolingModelService.toolingModelTemplate;

      expect(query!.where.conditions.length).toEqual(0);

      modelService.upsertWhereFieldExpr(getMockWhereObj());
      expect(query!.where.conditions.length).toBe(1);
      modelService.removeWhereFieldCondition(
        getMockWhereObj().fieldCompareExpr
      );
      expect(query!.where.conditions.length).toBe(0);
    });

    it('should UPDATE AND | OR in the model', () => {
      (messageService.setState as jest.Mock).mockClear();
      expect(messageService.setState).toHaveBeenCalledTimes(0);
      query = ToolingModelService.toolingModelTemplate;

      expect(query!.where.andOr).toBeUndefined();

      modelService.setAndOr(AndOr.AND);
      expect(query!.where.andOr).toContain(AndOr.AND);

      modelService.setAndOr(AndOr.OR);
      expect(query!.where.andOr).toContain(AndOr.OR);
    });
  });

  // ORDER BY
  describe('ORDER BY', () => {
    it('should add, update, remove order by fields in model', () => {
      (messageService.setState as jest.Mock).mockClear();
      expect(messageService.setState).toHaveBeenCalledTimes(0);
      query = ToolingModelService.toolingModelTemplate;

      expect(query!.orderBy.length).toEqual(0);

      // Add
      modelService.addUpdateOrderByField(mockOrderBy);
      expect(query!.orderBy.length).toBe(1);
      expect(query!.orderBy[0].field).toContain(mockOrderBy.field);
      expect(query!.orderBy[0].order).toContain(mockOrderBy.order);
      expect(query!.orderBy[0].nulls).toContain(mockOrderBy.nulls);

      // But Not Duplicate
      modelService.addUpdateOrderByField(mockOrderBy);
      expect(query!.orderBy.length).toBe(1);

      // Yet Update Field IF Direction and/or Nulls Change
      expect(query!.orderBy[0].order).toBeDefined();
      const updatedOrderBy = {
        field: 'orderBy1',
        order: undefined,
        nulls: 'NULLS LAST'
      };
      modelService.addUpdateOrderByField(updatedOrderBy);
      expect(query!.orderBy[0].order).not.toBeDefined();

      // Delete
      modelService.removeOrderByField(mockOrderBy.field);
      expect(query!.orderBy.length).toBe(0);
      // verify saves
      expect(messageService.setState).toHaveBeenCalledTimes(4);
    });

    it('should update limit in model', () => {
      (messageService.setState as jest.Mock).mockClear();
      expect(messageService.setState).toHaveBeenCalledTimes(0);
      query = ToolingModelService.toolingModelTemplate;

      expect(query!.limit).toEqual('');

      // Add
      modelService.changeLimit('11');
      expect(query!.limit).toBe('11');

      // Remove Limit
      modelService.changeLimit(undefined);
      expect(query!.limit).toBe('');

      // verify saves
      expect(messageService.setState).toHaveBeenCalledTimes(2);
    });

    it('should add orderby as immutablejs', () => {
      modelService.addUpdateOrderByField(mockOrderBy);
      const orderBy = modelService.getModel().get('orderBy');
      expect(typeof orderBy.toJS).toEqual('function');
    });
  });

  // LIMIT
  describe('LIMIT', () => {
    it('should update limit in model', () => {
      (messageService.setState as jest.Mock).mockClear();
      expect(messageService.setState).toHaveBeenCalledTimes(0);
      query = ToolingModelService.toolingModelTemplate;

      expect(query!.limit).toEqual('');

      // Add
      modelService.changeLimit('11');
      expect(query!.limit).toBe('11');

      // Remove Limit
      modelService.changeLimit(undefined);
      expect(query!.limit).toBe('');

      // verify saves
      expect(messageService.setState).toHaveBeenCalledTimes(2);
    });
  });
});
