/* eslint-disable no-unused-vars */
import { fromJS, List, Map } from 'immutable';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { JsonMap } from '@salesforce/ts-types';

// This is to satisfy TS and stay dry
export type IMap = Map<string, string | List<string>>;
// Private immutable interface
interface SoqlQueryModel extends IMap {
  sObject: string;
  fields: List<string>;
}
// Public inteface for accessing modelService.query
export interface SoqlModelJson extends JsonMap {
  sObject: string;
  fields: string[];
}

export class ModelService {
  private model: BehaviorSubject<SoqlQueryModel>;
  public query: Observable<SoqlModelJson>;
  private defaultQueryModel: IMap;

  constructor() {
    this.defaultQueryModel = Map({
      sObject: '',
      fields: List<string>([])
    });
    this.model = new BehaviorSubject(
      fromJS(this.read() || this.defaultQueryModel)
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

  public setSObject(sObject: string) {
    this.model.next(fromJS(this.defaultQueryModel).set('sObject', sObject));
  }

  public addField(field: string) {
    this.model.next(
      this.getModel().set(
        'fields',
        this.getFields().toSet().add(field).toList()
      ) as SoqlQueryModel
    );
  }

  public removeField(field: string) {
    this.model.next(
      this.getModel().set(
        'fields',
        this.getFields().filter((item) => {
          return item !== field;
        }) as List<string>
      ) as SoqlQueryModel
    );
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
