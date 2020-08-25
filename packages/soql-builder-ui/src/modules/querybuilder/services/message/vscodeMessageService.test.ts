/*
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 */

import { VscodeMessageService, MessageType } from './vscodeMessageService';
import { getWindow } from '../globals';

describe('VscodeMessageService', () => {
  let vsCodeApi;
  let listener;
  let vscodeMessageService;
  let window;
  const messageType = 'message';
  let accountQuery = {
    sObject: 'Account',
    fields: []
  };
  let postMessagePayload = (type?: string, message?: string) => {
    return {
      data: {
        type: type || MessageType.UPDATE,
        message: message || JSON.stringify(accountQuery)
      }
    };
  };

  beforeEach(() => {
    // @ts-ignore
    // eslint-disable-next-line no-undef
    window = getWindow();
    // @ts-ignore
    // eslint-disable-next-line no-undef
    vsCodeApi = acquireVsCodeApi();
    listener = jest.fn();
    vscodeMessageService = new VscodeMessageService();
    vscodeMessageService.message.subscribe(listener);
  });

  it('calls postMessage with activated type immediately when created', () => {
    expect(vsCodeApi).toBeTruthy();
    jest.spyOn(vsCodeApi, 'postMessage');
    // eslint-disable-next-line no-new
    new VscodeMessageService();
    expect(vsCodeApi.postMessage).toHaveBeenCalled();
    expect(vsCodeApi.postMessage).toHaveBeenCalledWith({
      type: MessageType.ACTIVATED
    });
  });

  it('sets and gets state', () => {
    const state = 'hello world';
    vscodeMessageService.setState(state);
    expect(vscodeMessageService.getState()).toEqual(state);
  });

  it('passes through query messages from the text editor', () => {
    const messageEvent = new MessageEvent(messageType, postMessagePayload());
    window.dispatchEvent(messageEvent);
    expect(listener).toHaveBeenCalled();
    expect(listener.mock.calls[0][0].message.sObject).toEqual(
      accountQuery.sObject
    );
  });

  it('filters out messages for a while after sendMessage to prevent immediate callbacks', () => {
    jest.useFakeTimers();
    // this will trigger events to be rejected for some amount of time.
    vscodeMessageService.sendMessage(postMessagePayload);
    const messageEvent = new MessageEvent(messageType, postMessagePayload());
    window.dispatchEvent(messageEvent);
    expect(listener).toHaveBeenCalledTimes(0);
    jest.runAllTimers();

    // after time expires, this event will get accepted
    window.dispatchEvent(messageEvent);
    expect(listener).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it('filters out unparseable queries', () => {
    const messageEvent = new MessageEvent(
      messageType,
      postMessagePayload(undefined, 'covid-19')
    );
    window.dispatchEvent(messageEvent);
    expect(listener).toHaveBeenCalledTimes(0);
  });

  it('filters out messages of the wrong type', () => {
    const messageEvent = new MessageEvent(
      messageType,
      postMessagePayload('covid-19')
    );
    window.dispatchEvent(messageEvent);
    expect(listener).toHaveBeenCalledTimes(0);
  });

  it('filters out incomplete queries', () => {
    const incompleteQuery = { ...accountQuery };
    incompleteQuery.sObject = 'Acco';
    const messageEvent = new MessageEvent(
      messageType,
      postMessagePayload(JSON.stringify(incompleteQuery))
    );
    window.dispatchEvent(messageEvent);
    expect(listener).toHaveBeenCalledTimes(0);
  });

  it('filters out repeated queries', () => {
    let messageEvent = new MessageEvent(messageType, postMessagePayload());
    expect(listener).toHaveBeenCalledTimes(0);
    window.dispatchEvent(messageEvent);
    expect(listener).toHaveBeenCalledTimes(1);
    messageEvent = new MessageEvent(messageType, postMessagePayload());
    window.dispatchEvent(messageEvent);
    expect(listener).toHaveBeenCalledTimes(1); // not incremented
  });
});
