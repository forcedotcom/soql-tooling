/* 
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *   
 */

import { VscodeMessageService } from "./vscodeMessageService";
import { getWindow } from "../globals";

describe('VscodeMessageService', ()=> {
    let vsCodeApi;
    let accountQuery = {
        sObject: 'Account',
        fields: []
      };
    let postMessagePayload = (type?: string, message?: string) => { 
        return {data: { 
            type: type || 'update', 
            message: message || JSON.stringify(accountQuery)
        }}
    }

    beforeEach(() => {
        // @ts-ignore
        // eslint-disable-next-line no-undef
        vsCodeApi = acquireVsCodeApi();
    });

    it('calls postMessage with activated type immediately when created', () => {
        expect(vsCodeApi).toBeTruthy();
        jest.spyOn(vsCodeApi, 'postMessage');
        // eslint-disable-next-line no-new
        new VscodeMessageService();
        expect(vsCodeApi.postMessage).toHaveBeenCalled();
        expect(vsCodeApi.postMessage).toHaveBeenCalledWith({type: 'activated'});
    });

    it('sets and gets state', () => {
        const vscodeMessageService = new VscodeMessageService();
        vscodeMessageService.setState('hello world');
        expect(vscodeMessageService.getState()).toEqual('hello world');
    });

    // eslint-disable-next-line jest/no-test-callback
    it('passes through query messages from the text editor', () => {
        let event;
        const vscodeMessageService = new VscodeMessageService();
        vscodeMessageService.message.subscribe(msg => {
            event = msg
        });
        const window = getWindow();
        const messageEvent = new MessageEvent('message', postMessagePayload());
        window.dispatchEvent(messageEvent);
        expect(event.message.sObject).toEqual(accountQuery.sObject);


    });

    it('filters out messages for a while after sendMessage to prevent immediate callbacks', () => {
        jest.useFakeTimers();
        const listener = jest.fn();
        const vscodeMessageService = new VscodeMessageService();
        vscodeMessageService.message.subscribe(listener);
        vscodeMessageService.sendMessage(postMessagePayload);
        const window = getWindow();
        const messageEvent = new MessageEvent('message', postMessagePayload());
        window.dispatchEvent(messageEvent);
        expect(listener).toHaveBeenCalledTimes(0);
        jest.runAllTimers();
        window.dispatchEvent(messageEvent);
        expect(listener).toHaveBeenCalledTimes(1);
        jest.useRealTimers();
    });

    it('filters out unparseable queries', () => {
        const listener = jest.fn();
        const vscodeMessageService = new VscodeMessageService();
        vscodeMessageService.message.subscribe(listener);
        const window = getWindow();
        const messageEvent = new MessageEvent('message', postMessagePayload(undefined, 'covid-19'));
        window.dispatchEvent(messageEvent);
        expect(listener).toHaveBeenCalledTimes(0);
    });

    it('filters out messages of the wrong type', () => {
        const listener = jest.fn();
        const vscodeMessageService = new VscodeMessageService();
        vscodeMessageService.message.subscribe(listener);
        const window = getWindow();
        const messageEvent = new MessageEvent('message', postMessagePayload('covid-19'));
        window.dispatchEvent(messageEvent);
        expect(listener).toHaveBeenCalledTimes(0);
    });

    it('filters out incomplete queries', () => {
        const listener = jest.fn();
        const vscodeMessageService = new VscodeMessageService();
        vscodeMessageService.message.subscribe(listener);
        const window = getWindow();
        const incompleteQuery = { ...accountQuery };
        incompleteQuery.sObject='Acco';
        const messageEvent = new MessageEvent('message', postMessagePayload(JSON.stringify(incompleteQuery)));
        window.dispatchEvent(messageEvent);
        expect(listener).toHaveBeenCalledTimes(0);
    });

    it('filters out repeated queries', () => {
        const listener = jest.fn();
        const vscodeMessageService = new VscodeMessageService();
        vscodeMessageService.message.subscribe(listener);
        const window = getWindow();
        let messageEvent = new MessageEvent('message', postMessagePayload());
        expect(listener).toHaveBeenCalledTimes(0);
        window.dispatchEvent(messageEvent);
        expect(listener).toHaveBeenCalledTimes(1);
        messageEvent = new MessageEvent('message', postMessagePayload());
        window.dispatchEvent(messageEvent);
        expect(listener).toHaveBeenCalledTimes(1);// not incremented
    });
});