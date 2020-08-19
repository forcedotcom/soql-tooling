import { JsonMap } from '@salesforce/ts-types';
import { IMessageService, SoqlEditorEvent } from './iMessageService';
import { fromEvent, Observable } from 'rxjs';
import { filter, map, pluck, tap, distinctUntilChanged } from 'rxjs/operators';
import { getWindow, getVscode } from '../globals';

export class VscodeMessageService implements IMessageService {
    private vscode;
    public message: Observable<SoqlEditorEvent>;
    private listen = true;
    constructor() {
        this.vscode = getVscode();
        const source = fromEvent(getWindow(), 'message');
        this.message = source.pipe(
            filter(() => { return this.listen; }), // we chill for a while after sending a message
            pluck('data'), // all we care about is the innner data
            filter((event: SoqlEditorEvent) => { return event.type === 'update';}), // all we care about is update events
            distinctUntilChanged((oldEvent: SoqlEditorEvent, newEvent: SoqlEditorEvent) => { 
                return newEvent.message === JSON.stringify(oldEvent.message) }), // and only changes
            map((event) => {
                try {
                    event.message = JSON.parse(event.message);
                    return event;
                } catch(e) {
                    console.error('message is not parsable', e);
                }
                return event;
            }),// parse it.
            filter((event) => { return typeof event.message === 'object'; })); // make sure it's a successful parse.
        this.sendActivatedMessage();
    }
    public sendActivatedMessage() {
        this.vscode.postMessage({type: 'activated'});
    }
    public sendMessage(query: JsonMap) {
        this.listen = false;
        this.vscode.postMessage({
            type: 'query',
            message: JSON.stringify(query),
        });
        this.setState(query);
        setTimeout(() => {
            this.listen = true;
        }, 2000);
    }
    public getState() {
        let state = this.vscode.getState();
        if (state && typeof state === 'string') {
            try {
                state = JSON.parse(state);
            } catch(e) {
                console.error('could not parse state');
            }
        }
        return state;
    }

    public setState(state: JsonMap) {
        this.vscode.setState(JSON.stringify(state));
    }
}