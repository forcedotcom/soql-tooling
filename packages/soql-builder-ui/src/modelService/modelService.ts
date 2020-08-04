import { JsonMap } from "@salesforce/ts-types";

export type SoqlQueryModel = {
    sObject: string;
    fields: string[];
}

class QueryModel implements SoqlQueryModel {
    sObject: string;
    fields: string[]; 
    constructor(json?: SoqlQueryModel) {
        this.sObject = '';
        this.fields = [] as string[] ;
        if (json) {
            Object.assign(this, json);
        }
    }
    copy() {
        const queryModel = new QueryModel();
        queryModel.sObject = this.sObject;
        queryModel.fields = this.fields;
        return queryModel;
    }
    toString(): string {
        return JSON.stringify(this);
    }
}
export class ModelService {

    private query: QueryModel;

    constructor() {
        this.query = new QueryModel(this.read());
    }

    public getQuery() {
        return this.query;
    }
    public setSObject(sObject: string) {
        const queryModel = new QueryModel();
        queryModel.sObject = sObject;
        this.query = queryModel;
        return this.query;
    }

    public addField(field: string) {
        if (this.query.fields.includes(field)) {
            return this.query;
        }
        const queryModel = this.query.copy();
        queryModel.fields = this.query.fields.concat(field);
        this.query = queryModel;
        return this.query;
    }

    public removeField(field: string) {
        const queryModel = this.query.copy();
        queryModel.fields = queryModel.fields.filter((existingField) => {
            return existingField !== field;
        });
        this.query = queryModel;
        return this.query;
    }

    public save() {
        localStorage.setItem("soql", this.query.toString());
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