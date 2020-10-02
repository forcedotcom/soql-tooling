/*
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 */

import { IMessageService } from './iMessageService';
import { JsonMap } from '@salesforce/ts-types';
import { getLocalStorage, getWindow } from '../globals';
import { BehaviorSubject } from 'rxjs';
import { MessageType, SoqlEditorEvent } from './soqlEditorEvent';
import { VscodeMessageService } from './vscodeMessageService';

class MockVscode {
  private window = getWindow();
  private localStorage = getLocalStorage();
  postMessage(messageObj) {
    this.window.parent.postMessage(messageObj, '*');
  }
  public getState(): JsonMap {
    let state = this.localStorage.getItem('query');
    try {
      return JSON.parse(state);
    } catch (e) {
      this.localStorage.clear();
      console.log('state can not be parsed');
    }
    return state;
  }

  public setState(state: JsonMap) {
    this.localStorage.setItem('query', JSON.stringify(state));
  }
}

export class StandaloneMessageService
  extends VscodeMessageService
  implements IMessageService {
  public messagesToUI: BehaviorSubject<SoqlEditorEvent>;
  public localStorage;
  protected vscode;
  constructor() {
    super();
    this.localStorage = getLocalStorage();
  }

  public sendActivatedMessage() {
    this.vscode = new MockVscode();
    this.vscode.postMessage({ type: MessageType.UI_ACTIVATED });
  }
}
