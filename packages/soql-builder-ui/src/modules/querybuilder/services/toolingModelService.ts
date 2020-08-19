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

  constructor() {
    this.toolingModelTemplate = {
      sObject: '',
      fields: []
    } as ToolingModelJson;

    this.model = new BehaviorSubject(
      fromJS(this.read() || this.toolingModelTemplate)
    );

    this.query = this.model.pipe(
      map((soqlQueryModel) => (soqlQueryModel as IMap).toJS())
    );
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

  // BELOW HERE IS JUST TEMPORARY SAVE FUNCTIONALITY TO TEST RE_HYDRATIONG THE UI BASED ON AN EXISTING QUERY
  public save() {
    localStorage.setItem('soql', JSON.stringify(this.getModel().toJS()));
  }

  public read() {
    let saved;
    try {
      if (localStorage) {
        saved = localStorage.getItem('soql');
      }
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      saved = null;
    }
    return saved;
  }

  public clear() {
    localStorage.clear();
  }
}
