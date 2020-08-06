/* eslint-disable no-unused-vars */
import { fromJS, List, Map, Set } from "immutable";
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from "rxjs/operators";

export interface SoqlQueryModel extends Map<string, string | List<string>> {
    sObject: string;
    fields: List<string>;
}

// class QueryModel implements SoqlQueryModel {
//     sObject: string;
//     fields: List<string>; 
//     constructor(json?: SoqlQueryModel) {
//         this.sObject = '';
//         this.fields = List([]) ;
//         if (json) {
//             const newMap = fromJS(json);
//             Object.assign(this, newMap);
//         }
//     }
//     copy() {
//         const queryModel = new QueryModel();
//         queryModel.sObject = this.sObject;
//         queryModel.fields = this.fields;
//         return queryModel;
//     }
//     toString(): string {
//         return JSON.stringify(this);
//     }
// }
export class ModelService {

    private model: BehaviorSubject<SoqlQueryModel>;
    public query: Observable<SoqlQueryModel>;
    private defaultQueryModel: Map<string, string | List<string>>;

    constructor() {
        this.defaultQueryModel = Map({
            sObject: '',
            fields: List<string>([])
        })
        this.model = new BehaviorSubject(fromJS(this.read() || this.defaultQueryModel));
        this.query = this.model.pipe(map(soqlQueryModel => soqlQueryModel.toJS()))
    }
    public getQuery() {
        return this.model.getValue();
    }
    public getFields() {
        return (this.getQuery().get("fields") as List<string>);
    }
    public setSObject(sObject: string) {
        this.model.next(fromJS(this.defaultQueryModel).set("sObject", sObject));
    }

    public addField(field: string) {
        this.model.next(this.getQuery().set("fields", this.getFields().toSet().add(field).toList()) as SoqlQueryModel);
    }

    public removeField(field: string) {
        this.model.next(this.getQuery().set("fields", this.getFields().filter( (item) => { return item !== field}) as List<string>) as SoqlQueryModel);
    }

    public toString() {
        return JSON.stringify((this.getQuery()).toJS())
    }

    public save() {
        localStorage.setItem("soql", this.toString());
    }

    public read() {
        const saved = localStorage.getItem("soql");
        try {
            if (saved) {
                return JSON.parse(saved);
            }
        } catch(e) {
            console.error(e);
        }
        return saved;
    }

    public clear() {
        localStorage.clear();
    }
}