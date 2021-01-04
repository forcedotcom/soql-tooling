/*
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 */

import { fromJS, List } from 'immutable';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { JsonMap } from '@salesforce/ts-types';
import { IMessageService } from './message/iMessageService';
import { SoqlEditorEvent, MessageType } from './message/soqlEditorEvent';
import {
  convertUiModelToSoql,
  convertSoqlToUiModel
} from '../services/soqlUtils';
import { IMap, ToolingModel, ToolingModelJson, ModelProps } from './model';
export class ToolingModelService {
  private immutableModel: BehaviorSubject<ToolingModel>;
  public UIModel: Observable<ToolingModelJson>;
  public static toolingModelTemplate: ToolingModelJson = {
    sObject: '',
    fields: [],
    orderBy: [],
    limit: '',
    where: { conditions: [], andOr: undefined },
    errors: [],
    unsupported: [],
    originalSoqlStatement: ''
  } as ToolingModelJson;
  private messageService: IMessageService;

  constructor(messageService: IMessageService) {
    this.messageService = messageService;
    this.immutableModel = new BehaviorSubject(
      fromJS(ToolingModelService.toolingModelTemplate)
    );
    this.immutableModel.subscribe(this.saveViewState.bind(this));
    this.UIModel = this.immutableModel.pipe(
      map((soqlQueryModel) => {
        try {
          return (soqlQueryModel as IMap).toJS();
        } catch (e) {
          console.error('Unexpected Error in SOQL model: ' + e);
          return ToolingModelService.toolingModelTemplate;
        }
      })
    );

    this.messageService.messagesToUI.subscribe(
      this.onIncommingMessage.bind(this)
    );
  }

  public getModel(): IMap {
    return this.immutableModel.getValue();
  }

  /* ---- OBJECTS ---- */

  // This method is destructive, will clear any selections except sObject.
  public setSObject(sObject: string) {
    const emptyModel = fromJS(ToolingModelService.toolingModelTemplate);
    const newModelWithSelection = emptyModel.set(ModelProps.SOBJECT, sObject);

    this.changeModel(newModelWithSelection);
  }

  /* ---- FIELDS ---- */

  private getFields() {
    return this.getModel().get(ModelProps.FIELDS) as List<string>;
  }

  public addField(field: string) {
    const currentModel = this.getModel();
    const newModelWithAddedField = currentModel.set(
      ModelProps.FIELDS,
      this.getFields().toSet().add(field).toList()
    ) as ToolingModel;

    this.changeModel(newModelWithAddedField);
  }

  public removeField(field: string) {
    const currentModel = this.getModel();
    const newModelWithFieldRemoved = currentModel.set(
      ModelProps.FIELDS,
      this.getFields().filter((item) => {
        return item !== field;
      }) as List<string>
    ) as ToolingModel;

    this.changeModel(newModelWithFieldRemoved);
  }

  /* ---- ORDER BY ---- */

  private getOrderBy() {
    return this.getModel().get(ModelProps.ORDER_BY) as List<JsonMap>;
  }

  private hasOrderByField(field: string) {
    return this.getOrderBy().findIndex((item) => item.get('field') === field);
  }

  public addUpdateOrderByField(orderByObj: JsonMap) {
    const currentModel = this.getModel();
    let updatedOrderBy;
    const existingIndex = this.hasOrderByField(orderByObj.field);
    if (existingIndex > -1) {
      updatedOrderBy = this.getOrderBy().update(existingIndex, () => {
        return fromJS(orderByObj);
      });
    } else {
      updatedOrderBy = this.getOrderBy().push(fromJS(orderByObj));
    }
    const newModel = currentModel.set(
      ModelProps.ORDER_BY,
      updatedOrderBy
    ) as ToolingModel;
    this.changeModel(newModel);
  }

  public removeOrderByField(field: string) {
    const currentModel = this.getModel();
    const orderBy = this.getOrderBy();
    const filteredOrderBy = orderBy.filter((item) => {
      return item.get('field') !== field;
    }) as List<JsonMap>;
    const newModelWithFieldRemoved = currentModel.set(
      ModelProps.ORDER_BY,
      filteredOrderBy
    ) as ToolingModel;

    this.changeModel(newModelWithFieldRemoved);
  }

  /* ---- WHERE ---- */

  private getWhereConditions() {
    return this.getModel()
      .get(ModelProps.WHERE)
      .get(ModelProps.WHERE_CONDITIONS) as List<JsonMap>;
  }

  private hasWhereConditionBy(index: string) {
    if (this.getWhereConditions().count() > 0) {
      return this.getWhereConditions().find(
        (item) => item.get('index') === index
      );
    }
    return false;
  }

  public setAndOr(andOr: string) {
    const currentModel = this.getModel();
    const newModel = currentModel.setIn(
      [ModelProps.WHERE, ModelProps.WHERE_AND_OR],
      andOr
    );

    this.changeModel(newModel);
  }

  public upsertWhereFieldExpr(whereObj: JsonMap) {
    const currentModel = this.getModel();
    let updatedWhereCondition;
    const { fieldCompareExpr, andOr } = whereObj;
    const existingExpr = this.hasWhereConditionBy(fieldCompareExpr.index);
    if (existingExpr) {
      updatedWhereCondition = this.getWhereConditions().update(
        fieldCompareExpr.index,
        () => {
          return fromJS(fieldCompareExpr);
        }
      );
    } else {
      updatedWhereCondition = this.getWhereConditions().push(
        fromJS(fieldCompareExpr)
      );
    }

    let newModel = currentModel.setIn(
      [ModelProps.WHERE, ModelProps.WHERE_CONDITIONS],
      updatedWhereCondition
    );
    /*
    The UI model should always be aware
    of andOr UI state when expr is updated.
    */
    newModel = newModel.setIn(
      [ModelProps.WHERE, ModelProps.WHERE_AND_OR],
      andOr
    );

    this.changeModel(newModel);
  }

  public removeWhereFieldCondition(fieldCompareExpr: JsonMap) {
    const currentModel = this.getModel();
    const whereConditions = this.getWhereConditions();
    const filteredConditions = whereConditions.filter((item) => {
      return item.get('index') !== fieldCompareExpr.index;
    });

    const newModel = currentModel.setIn(
      [ModelProps.WHERE, ModelProps.WHERE_CONDITIONS],
      filteredConditions
    );

    this.changeModel(newModel);
  }

  /* ---- LIMIT ---- */

  public changeLimit(limit: string) {
    const newLimitModel = this.getModel().set(ModelProps.LIMIT, limit || '');
    this.changeModel(newLimitModel);
  }

  /* ---- MESSAGING ---- */

  private onIncommingMessage(event: SoqlEditorEvent) {
    if (event && event.type) {
      switch (event.type) {
        case MessageType.TEXT_SOQL_CHANGED: {
          const incomingSoqlStatement = event.payload as string;
          if (
            incomingSoqlStatement !==
            this.getModel().get(ModelProps.ORIGINAL_SOQL_STATEMENT)
          ) {
            const soqlJSModel = convertSoqlToUiModel(incomingSoqlStatement);
            soqlJSModel.originalSoqlStatement = incomingSoqlStatement;
            const updatedModel = fromJS(soqlJSModel);
            this.immutableModel.next(updatedModel);
          }
          break;
        }
        default:
          break;
      }
    }
  }

  /* ---- STATE & MODEL ---- */

  public saveViewState(model: ToolingModel) {
    try {
      this.messageService.setState((model as IMap).toJS());
    } catch (e) {
      console.error(e);
    }
  }

  private changeModel(newModel) {
    const newSoqlStatement = convertUiModelToSoql((newModel as IMap).toJS());
    this.sendMessageToBackend(newSoqlStatement);
    const newModelWithSoqlStatement = newModel.set(
      'originalSoqlStatement',
      newSoqlStatement
    );
    this.immutableModel.next(newModelWithSoqlStatement);
  }

  public sendMessageToBackend(payload: string) {
    try {
      this.messageService.sendMessage({
        type: MessageType.UI_SOQL_CHANGED,
        payload
      });
    } catch (e) {
      console.error(e);
    }
  }

  public restoreViewState() {
    this.immutableModel.next(this.getSavedState());
  }

  private getSavedState() {
    const savedState = this.messageService.getState();
    return fromJS(savedState || ToolingModelService.toolingModelTemplate);
  }
}
