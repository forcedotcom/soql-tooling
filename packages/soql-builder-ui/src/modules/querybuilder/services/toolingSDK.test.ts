/*
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 */

import { ToolingSDK } from './toolingSDK';
import { VscodeMessageService } from './message/vscodeMessageService';
import { IMessageService } from './message/iMessageService';
import { getWindow, getVscode } from './globals';
import { MessageType } from './message/soqlEditorEvent';

describe('Tooling SDK Service', () => {
  let toolingSDK: ToolingSDK;
  let messageService: IMessageService;
  let window = getWindow();
  let vscode;

  function postMessageFromVSCode(message) {
    const messageEvent = new MessageEvent('message', { data: message });
    window.dispatchEvent(messageEvent);
  }

  beforeEach(() => {
    messageService = new VscodeMessageService();
    toolingSDK = new ToolingSDK(messageService);
    vscode = getVscode();
  });

  it('Retrieve SObjects', () => {
    jest.spyOn(vscode, 'postMessage');
    const sObjectsObserver = jest.fn();
    toolingSDK.sobjects.subscribe(sObjectsObserver);

    toolingSDK.loadSObjectDefinitions();

    expect(vscode.postMessage).toHaveBeenCalled();
    expect(vscode.postMessage).toHaveBeenCalledWith({
      type: MessageType.SOBJECTS_REQUEST
    });

    const fakeSObjectNames = ['Hey', 'Jude'];
    postMessageFromVSCode({
      type: MessageType.SOBJECTS_RESPONSE,
      payload: fakeSObjectNames
    });
    expect(sObjectsObserver.mock.calls.length).toBe(2);
    expect(sObjectsObserver.mock.calls[0][0]).toStrictEqual([]);
    expect(sObjectsObserver.mock.calls[1][0]).toStrictEqual(fakeSObjectNames);
  });

  it('Retrieve SObject metadata', () => {
    jest.spyOn(vscode, 'postMessage');
    const fakeSObjectName = 'MySObject';

    const sObjectMetadataObserver = jest.fn();
    toolingSDK.sobjectMetadata.subscribe(sObjectMetadataObserver);
    toolingSDK.loadSObjectMetatada(fakeSObjectName);

    expect(vscode.postMessage).toHaveBeenCalled();
    expect(vscode.postMessage).toHaveBeenCalledWith({
      type: MessageType.SOBJECT_METADATA_REQUEST,
      payload: fakeSObjectName
    });

    const fakeSObjectMetadata = {
      foo: {},
      bar: {},
      fields: [
        { name: 'field1', extraStuff: 'xyz' },
        { name: 'field2', extraStuff: 'zyx' }
      ]
    };

    postMessageFromVSCode({
      type: MessageType.SOBJECT_METADATA_RESPONSE,
      payload: fakeSObjectMetadata
    });
    expect(sObjectMetadataObserver.mock.calls.length).toBe(2);
    expect(sObjectMetadataObserver.mock.calls[0][0]).toStrictEqual({
      fields: []
    });
    expect(sObjectMetadataObserver.mock.calls[1][0]).toStrictEqual(
      fakeSObjectMetadata
    );
  });
});
