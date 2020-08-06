/* eslint-disable no-unused-vars */
import { fromJS, List, Map } from "immutable";
import { BehaviorSubject, Observable } from "rxjs";
import { map } from "rxjs/operators";

export interface SoqlQueryModel extends Map<string, string | List<string>> {
    sObject: string;
    fields: List<string>;
}
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
        this.query = this.model.pipe(map(soqlQueryModel => (soqlQueryModel as Map).toJS()))
    }
    public getQuery(): Map {
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

    // BELOW HERE IS JUST TEMPORARY SAVE FUNCTIONALITY TO TEST RE_HYDRATIONG THE UI BASED ON AN EXISTING QUERY
    public save() {
        localStorage.setItem("soql", JSON.stringify(this.getQuery().toJS()));
    }

    public read() {
        let saved = localStorage.getItem("soql");
        try {
            if (saved) {
                return JSON.parse(saved);
            }
        } catch(e) {
            console.error(e);
            saved = undefined;
        }
        return saved;
    }

    public clear() {
        localStorage.clear();
    }
}