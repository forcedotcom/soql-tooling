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
import { MessageServiceFactory } from "./message/messageServiceFactory";
import { IMessageService, SoqlEditorEvent } from "./message/iMessageService";


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

  constructor() {
    this.messageService = MessageServiceFactory.create();

    this.toolingModelTemplate = {
      sObject: '',
      fields: []
    } as ToolingModelJson;

    this.model = new BehaviorSubject(
      fromJS(this.restore() || this.toolingModelTemplate)
    );

    this.query = this.model.pipe(
      map((soqlQueryModel) => (soqlQueryModel as IMap).toJS())
    );

    this.messageService.message.subscribe(this.onMessage.bind(this));
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
    this.save();
  }

  public addField(field: string) {
    const currentModel = this.getModel();
    const newModelWithAddedField = currentModel.set(
      'fields',
      this.getFields().toSet().add(field).toList()
    ) as ToolingModel;

    this.model.next(newModelWithAddedField);
    this.save();
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
    this.save();
  }

  private onMessage(event: SoqlEditorEvent) {
    if (event && event.type) {
        switch(event.type) {
            case 'update': {
                let message = event.message;
                    const model = fromJS(message);
                    this.model.next(model);
                break;
            }
            default: console.log('message type not expected');
        }
    }
    
}

public save() {
  this.messageService.sendMessage(this.getModel().toJS());
}

public restore() {
  const state = this.messageService.getState();
  return state;
}
}
