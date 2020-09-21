/*
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 */

import { fromJS, List, Map } from 'immutable';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { JsonMap } from '@salesforce/ts-types';
import { IMessageService } from './message/iMessageService';
import { SoqlEditorEvent, MessageType } from './message/soqlEditorEvent';
import { convertUiModelToSoql, convertSoqlToUiModel } from '../services/soqlUtils';

// This is to satisfy TS and stay dry
type IMap = Map<string, string | List<string>>;
// Private immutable interface
interface ToolingModel extends IMap {
  sObject: string;
  fields: List<string>;
}
// Public inteface for accessing modelService.query
export interface ToolingModelJson extends JsonMap {
  sObject: string;
  fields: string[];
}

export class ToolingModelService {
  private model: BehaviorSubject<ToolingModel>;
  public query: Observable<ToolingModelJson>;
  private toolingModelTemplate: ToolingModelJson;
  private messageService: IMessageService;

  constructor(messageService: IMessageService) {
    this.messageService = messageService;
    this.toolingModelTemplate = {
      sObject: '',
      fields: []
    } as ToolingModelJson;

    this.model = new BehaviorSubject(fromJS(this.toolingModelTemplate));
    this.model.subscribe(this.saveViewState.bind(this));
    this.query = this.model.pipe(
      map((soqlQueryModel) => {
        try {
          return (soqlQueryModel as IMap).toJS();
        } catch (e) {
          console.error('Unexpected Error in SOQL model: ' + e);
          return this.toolingModelTemplate;
        }
      })
    );
    this.query.subscribe(this.generateQuery.bind(this));

    this.messageService.messagesToUI.subscribe(this.onMessage.bind(this));
  }

  public getModel(): IMap {
    return this.model.getValue();
  }

  private getFields() {
    return this.getModel().get('fields') as List<string>;
  }
  // This method is destructive, will clear any selections except sObject.
  public setSObject(sObject: string) {
    const emptyModel = fromJS(this.toolingModelTemplate);
    const newModelWithSelection = emptyModel.set('sObject', sObject);

    this.model.next(newModelWithSelection);
  }

  public addField(field: string) {
    const currentModel = this.getModel();
    const newModelWithAddedField = currentModel.set(
      'fields',
      this.getFields().toSet().add(field).toList()
    ) as ToolingModel;

    this.model.next(newModelWithAddedField);
  }

  public removeField(field: string) {
    const currentModel = this.getModel();
    const newModelWithFieldRemoved = currentModel.set(
      'fields',
      this.getFields().filter((item) => {
        return item !== field;
      }) as List<string>
    ) as ToolingModel;

    this.model.next(newModelWithFieldRemoved);
  }

  private onMessage(event: SoqlEditorEvent) {
    if (event && event.type) {
      switch (event.type) {
        case MessageType.TEXT_SOQL_CHANGED: {
          const soqlJSModel = convertSoqlToUiModel(event.payload as string);
          const updatedModel = fromJS(soqlJSModel);
          if (!updatedModel.equals(this.model.getValue())) {
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

  public generateQuery(jsModel: ToolingModelJson) {
    try {
      this.messageService.sendMessage({
        type: MessageType.UI_SOQL_CHANGED,
        payload: convertUiModelToSoql(jsModel)
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
    return fromJS(savedState || this.toolingModelTemplate);
  }
}
