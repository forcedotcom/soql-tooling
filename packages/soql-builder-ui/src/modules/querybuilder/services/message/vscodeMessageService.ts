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
import { filter, map, pluck, distinctUntilChanged } from 'rxjs/operators';
import { getWindow, getVscode } from '../globals';
import { ToolingSDK } from '../toolingSDK';
import { ToolingModelJson } from '../toolingModelService';

export enum MessageType {
  ACTIVATED = 'activated',
  QUERY = 'query',
  UPDATE = 'update'
}

export class VscodeMessageService implements IMessageService {
  private vscode;
  public message: Observable<SoqlEditorEvent>;
  private listen = true;
  private toolingSdk: ToolingSDK;

  constructor() {
    this.vscode = getVscode();
    this.toolingSdk = new ToolingSDK();
    const source = fromEvent(getWindow(), 'message');
    this.message = source.pipe(
      this.afterMessageDelay(),
      this.onlyDataProperty(),
      this.onlyUpdateEventTypes(),
      this.onlyIfChanged(),
      this.parseEventMessage(),
      this.onlyIfValidJson(),
      this.onlyValidSObjects()
    );
    this.sendActivatedMessage();
  }

  private afterMessageDelay() {
    return filter(() => {
      return this.listen;
    });
  }

  private onlyDataProperty() {
    return pluck('data');
  }

  private onlyUpdateEventTypes() {
    return filter((event: SoqlEditorEvent) => {
      return event.type === MessageType.UPDATE;
    });
  }

  private onlyIfChanged() {
    return distinctUntilChanged(
      (prev: SoqlEditorEvent, curr: SoqlEditorEvent) => {
        return curr.message === JSON.stringify(prev.message);
      }
    );
  }

  private onlyIfValidJson() {
    return filter((event: SoqlEditorEvent) => {
      return typeof event.message === 'object';
    });
  }

  private parseEventMessage() {
    return map((event: SoqlEditorEvent) => {
      try {
        event.message = JSON.parse(event.message as string) as ToolingModelJson;
        return event;
      } catch (e) {
        // we can just ignore this.  likely, user is typing and json is not valid.
      }
      return event;
    });
  }

  private onlyValidSObjects() {
    return filter((event: SoqlEditorEvent) => {
      return this.toolingSdk.sObjects.includes(
        ((event.message as unknown) as ToolingModelJson).sObject
      );
    });
  }

  public sendActivatedMessage() {
    this.vscode.postMessage({ type: MessageType.ACTIVATED });
  }
  public sendMessage(query: JsonMap) {
    this.listen = false;
    this.vscode.postMessage({
      type: MessageType.QUERY,
      message: JSON.stringify(query)
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
      } catch (e) {
        console.error('could not parse state');
      }
    }
    return state;
  }

  public setState(state: JsonMap) {
    this.vscode.setState(JSON.stringify(state));
  }
}
