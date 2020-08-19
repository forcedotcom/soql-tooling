/* eslint-disable no-unused-vars */
import { fromJS, List, Map } from "immutable";
import { BehaviorSubject, Observable } from "rxjs";
import { map } from "rxjs/operators";
import { MessageServiceFactory } from "./message/messageServiceFactory";
import { IMessageService, SoqlEditorEvent } from "./message/iMessageService";

export interface SoqlQueryModel extends Map<string, string | List<string>> {
    sObject: string;
    fields: List<string>;
}
export class ModelService {

    private model: BehaviorSubject<SoqlQueryModel>;
    public query: Observable<SoqlQueryModel>;
    private defaultQueryModel: Map<string, string | List<string>>;
    private messageService: IMessageService;

    constructor() {
        this.defaultQueryModel = Map({
            sObject: '',
            fields: List<string>([])
        })
        this.messageService = MessageServiceFactory.create();
        const state = this.restore();
        console.log('did we get state?', typeof state, state);
        this.model = new BehaviorSubject(fromJS(state || this.defaultQueryModel));
        this.query = this.model.pipe(map(soqlQueryModel => {
            return (soqlQueryModel as Map).toJS()
        }));
        this.messageService.message.subscribe(this.onMessage.bind(this));
    }
    public getQuery(): Map {
        return this.model.getValue();
    }
    public getFields() {
        return (this.getQuery().get("fields") as List<string>);
    }
    public setSObject(sObject: string) {
        this.model.next(fromJS(this.defaultQueryModel).set("sObject", sObject));
        this.save();
    }

    public addField(field: string) {
        this.model.next(this.getQuery().set("fields", this.getFields().toSet().add(field).toList()) as SoqlQueryModel);
        this.save();
    }

    public removeField(field: string) {
        this.model.next(this.getQuery().set("fields", this.getFields().filter( (item) => { return item !== field}) as List<string>) as SoqlQueryModel);
        this.save();
    }

    private onMessage(event: SoqlEditorEvent) {
        if (event && event.type) {
            switch(event.type) {
                case 'update': {
                    let message = event.message;
                    try {
                        const model = fromJS(message);
                        this.model.next(model);
                    } catch(e) {
                        console.error(`message ${message} was not parsable: `, e);
                    }
                    break;
                }
                default: console.log('message type not expected');
            }
        }
        
    }
    
    public save() {
        this.messageService.sendMessage(this.getQuery().toJS());
    }

    public restore() {
        const state = this.messageService.getState();
        return state;
    }

    public clear() {
        localStorage.clear();
    }
    
}