import { Observable } from 'rxjs';
import { JsonMap } from '@salesforce/ts-types';
import { SoqlQueryModel } from '../modelService';

export interface SoqlEditorEvent {
    type: string;
    message: string | SoqlQueryModel;
  }

export interface IMessageService {
    message: Observable<SoqlEditorEvent>;
    sendMessage(message: string): void;
    setState(state: JsonMap): void;
    getState(): JsonMap;
}