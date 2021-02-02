/*
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 */

import { fromJS, List, Map } from 'immutable';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { JsonMap } from '@salesforce/ts-types';
import { IMessageService } from './message/iMessageService';
import { SoqlEditorEvent, MessageType } from './message/soqlEditorEvent';
import {
  convertUiModelToSoql,
  convertSoqlToUiModel
} from '../services/soqlUtils';
import { createQueryTelemetry } from './telemetryUtils';

// This is to satisfy TS and stay dry
type IMap = Map<string, string | List<string>>;
// Private immutable interface
export interface ToolingModel extends IMap {
  headerComments?: string;
  sObject: string;
  fields: List<string>;
  orderBy: List<Map>;
  limit: string;
  errors: List<Map>;
  unsupported: List<Map>;
  originalSoqlStatement: string;
}
// Public inteface for accessing modelService.query
export interface ToolingModelJson extends JsonMap {
  headerComments?: string;
  sObject: string;
  fields: string[];
  orderBy: JsonMap[];
  limit: string;
  errors: JsonMap[];
  unsupported: JsonMap[];
  originalSoqlStatement: string;
}

export class ToolingModelService {
  private model: BehaviorSubject<ToolingModel>;
  public query: Observable<ToolingModelJson>;
  public static toolingModelTemplate: ToolingModelJson = {
    sObject: '',
    fields: [],
    orderBy: [],
    limit: '',
    errors: [],
    unsupported: [],
    originalSoqlStatement: ''
  } as ToolingModelJson;
  private messageService: IMessageService;

  constructor(messageService: IMessageService) {
    this.messageService = messageService;
    this.model = new BehaviorSubject(
      fromJS(ToolingModelService.toolingModelTemplate)
    );
    this.model.subscribe(this.saveViewState.bind(this));
    this.query = this.model.pipe(
      map((soqlQueryModel) => {
        try {
          return (soqlQueryModel as IMap).toJS();
        } catch (e) {
          console.error('Unexpected Error in SOQL model: ' + e);
          return ToolingModelService.toolingModelTemplate;
        }
      })
    );

    this.messageService.messagesToUI.subscribe(this.onMessage.bind(this));
  }

  public getModel(): IMap {
    return this.model.getValue();
  }

  private getFields() {
    return this.getModel().get('fields') as List<string>;
  }

  private getOrderBy() {
    return this.getModel().get('orderBy') as List<JsonMap>;
  }
  // This method is destructive, will override any selections with the
  // template and then set the sObject
  public setSObject(sObject: string) {
    const newModelJS = Object.assign(
      this.getModel().toJS(),
      ToolingModelService.toolingModelTemplate,
      {
        sObject: sObject
      }
    );
    this.changeModel(fromJS(newModelJS));
  }

  public addField(field: string) {
    const currentModel = this.getModel();
    const newModelWithAddedField = currentModel.set(
      'fields',
      this.getFields().toSet().add(field).toList()
    ) as ToolingModel;

    this.changeModel(newModelWithAddedField);
  }

  public removeField(field: string) {
    const currentModel = this.getModel();
    const newModelWithFieldRemoved = currentModel.set(
      'fields',
      this.getFields().filter((item) => {
        return item !== field;
      }) as List<string>
    ) as ToolingModel;

    this.changeModel(newModelWithFieldRemoved);
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
      'orderBy',
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
      'orderBy',
      filteredOrderBy
    ) as ToolingModel;

    this.changeModel(newModelWithFieldRemoved);
  }

  public changeLimit(limit: string) {
    const newLimitModel = this.getModel().set('limit', limit || '');
    this.changeModel(newLimitModel);
  }

  private onMessage(event: SoqlEditorEvent) {
    if (event && event.type) {
      switch (event.type) {
        case MessageType.TEXT_SOQL_CHANGED: {
          const originalSoqlStatement = event.payload as string;
          const soqlJSModel = convertSoqlToUiModel(originalSoqlStatement);
          soqlJSModel.originalSoqlStatement = originalSoqlStatement;
          const updatedModel = fromJS(soqlJSModel);
          if (!updatedModel.equals(this.model.getValue())) {
            if (
              originalSoqlStatement.length &&
              (soqlJSModel.errors.length || soqlJSModel.unsupported.length)
            ) {
              this.sendTelemetryToBackend(soqlJSModel);
            }
            this.model.next(updatedModel);
          }
          break;
        }
        default:
          break;
      }
    }
  }

  public saveViewState(model: ToolingModel) {
    try {
      this.messageService.setState((model as IMap).toJS());
    } catch (e) {
      console.error(e);
    }
  }

  private changeModel(newModel) {
    const newSoqlQuery = convertUiModelToSoql((newModel as IMap).toJS());
    const newModelWithSoqlQuery = newModel.set(
      'originalSoqlStatement',
      newSoqlQuery
    );
    this.model.next(newModelWithSoqlQuery);
    this.sendMessageToBackend(newSoqlQuery);
  }

  public sendMessageToBackend(newSoqlQuery: string) {
    try {
      this.messageService.sendMessage({
        type: MessageType.UI_SOQL_CHANGED,
        payload: newSoqlQuery
      });
    } catch (e) {
      console.error(e);
    }
  }

  public sendTelemetryToBackend(query: ToolingModelJson) {
    try {
      const telemetryMetrics = createQueryTelemetry(query);
      this.messageService.sendMessage({
        type: MessageType.UI_TELEMETRY,
        payload: telemetryMetrics
      });
    } catch (e) {
      console.error(e);
    }
  }

  public restoreViewState() {
    this.model.next(this.getSavedState());
  }

  private getSavedState() {
    const savedState = this.messageService.getState();
    return fromJS(savedState || ToolingModelService.toolingModelTemplate);
  }
}
