/* 
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *   
 */

import { JsonMap } from '@salesforce/ts-types';
import { IMessageService, SoqlEditorEvent } from './iMessageService';
import { fromEvent, Observable } from 'rxjs';
import { filter, map, pluck, tap, distinctUntilChanged } from 'rxjs/operators';
import { getWindow, getVscode } from '../globals';
import { ToolingSDK } from '../toolingSDK';
import { ToolingModelJson } from '../toolingModelService';

export class VscodeMessageService implements IMessageService {
    private vscode;
    public message: Observable<SoqlEditorEvent>;
    private listen = true;
    private toolingSdk: ToolingSDK;
    public static ACTIVATED_TYPE = 'activated';
    public static QUERY_TYPE = 'query';
    public static UPDATE_TYPE = 'update';
    constructor() {
        this.vscode = getVscode();
        this.toolingSdk = new ToolingSDK();
        const source = fromEvent(getWindow(), 'message');
        this.message = source.pipe(
            filter(() => { return this.listen; }), // we chill for a while after sending a message
            pluck('data'), // all we care about is the innner data
            filter((event: SoqlEditorEvent) => { return event.type === VscodeMessageService.UPDATE_TYPE;}), // all we care about is update events
            distinctUntilChanged((prev: SoqlEditorEvent, curr: SoqlEditorEvent) => { 
                return curr.message === JSON.stringify(prev.message) }), // and only changes
            map((event) => {
                try {
                    event.message = JSON.parse(event.message as string) as ToolingModelJson;
                    return event;
                } catch(e) {
                    // we can just ignore this.  likely, user is typing and json is not valid.
                }
                return event;
            }),// parse it.
            filter((event) => { return typeof event.message === 'object'; }),// make sure it's a successful parse.
            filter((event) => { return this.toolingSdk.sObjects.includes((event.message as unknown as ToolingModelJson).sObject); })// And an existing sObject and not a fragment
        );
        this.sendActivatedMessage();
    }
    public sendActivatedMessage() {
        this.vscode.postMessage({type: VscodeMessageService.ACTIVATED_TYPE});
    }
    public sendMessage(query: JsonMap) {
        this.listen = false;
        this.vscode.postMessage({
            type: VscodeMessageService.QUERY_TYPE,
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