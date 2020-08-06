/* eslint-disable no-unused-vars */
import { fromJS, List, Map, Set } from "immutable";

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

    private query: SoqlQueryModel;
    private defaultQueryModel: Map<string, string | List<string>>;

    constructor() {
        this.defaultQueryModel = Map({
            sObject: '',
            fields: List<string>([])
        })
        this.query = fromJS(this.read() || this.defaultQueryModel);
    }

    // RxJs Observable here.
    public getQuery() {
        return this.query.toJS();
    }
    public getFields() {
        return (this.query.get("fields") as List<string>);
    }
    public setSObject(sObject: string) {
        this.query = fromJS(this.defaultQueryModel).set("sObject", sObject) as SoqlQueryModel;
        return this.getQuery();
    }

    public addField(field: string) {
        this.query = this.query.set("fields", this.getFields().toSet().add(field).toList()) as SoqlQueryModel;
        return this.getQuery();
    }

    public removeField(field: string) {
        this.query = this.query.set("fields", this.getFields().filter( (item) => { return item !== field}) as List<string>) as SoqlQueryModel;
        return this.getQuery();
    }

    public toString() {
        return JSON.stringify((this.query).toJS())
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