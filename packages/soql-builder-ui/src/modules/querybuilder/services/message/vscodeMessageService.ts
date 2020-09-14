/*
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 */

import { JsonMap } from '@salesforce/ts-types';
import { IMessageService } from './iMessageService';
import { fromEvent, Observable } from 'rxjs';
import { filter, map, pluck, tap, distinctUntilChanged } from 'rxjs/operators';
import { getWindow, getVscode } from '../globals';
import { SoqlEditorEvent, MessageType } from './soqlEditorEvent';

export class VscodeMessageService implements IMessageService {
  private vscode;
  public messagesToUI: Observable<SoqlEditorEvent>;

  constructor() {
    this.vscode = getVscode();
    const source = fromEvent(getWindow(), 'message');
    this.messagesToUI = source.pipe(
      this.onlyDataProperty(),
      this.onlyIfValidEditorEvent()
    );
    this.sendActivatedMessage();
  }

  private onlyDataProperty() {
    return pluck('data');
  }

  private onlyIfValidEditorEvent() {
    return filter((event: object) => {
      return event['type'] !== undefined;
    });
  }
  public sendActivatedMessage() {
    this.vscode.postMessage({ type: MessageType.UI_ACTIVATED });
  }

  public async sendMessage(event: SoqlEditorEvent) {
    this.vscode.postMessage(event);
  }

  public getState() {
    let state = this.vscode.getState();
    return state;
  }

  public setState(state: JsonMap) {
    this.vscode.setState(state);
  }
}
