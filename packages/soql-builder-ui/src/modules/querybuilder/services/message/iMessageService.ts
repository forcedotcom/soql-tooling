import { Observable } from 'rxjs';
import { JsonMap } from '@salesforce/ts-types';

export interface SoqlEditorEvent {
    type: string;
    message: string;
  }

export interface IMessageService {
    message: Observable<SoqlEditorEvent>;
    sendMessage(message: string): void;
    setState(state: JsonMap): void;
    getState(): JsonMap;
}