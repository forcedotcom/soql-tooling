/*
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 */

import { IMessageService } from './message/iMessageService';
import { MessageType, SoqlEditorEvent } from './message/soqlEditorEvent';
import { BehaviorSubject, Observable } from 'rxjs';

export class ToolingSDK {
  private messageService: IMessageService;
  private latestSObjectName?: string;

  public sobjects: Observable = new BehaviorSubject<string[]>([]);
  public sobjectMetadata: Observable = new BehaviorSubject<any>({ fields: [] });
  public queryRunState: Observable = new BehaviorSubject<boolean>(false);

  constructor(messageService: IMessageService) {
    this.messageService = messageService;
    this.messageService.messagesToUI.subscribe(this.onMessage.bind(this));
  }

  private onMessage(event: SoqlEditorEvent) {
    if (event && event.type) {
      switch (event.type) {
        case MessageType.SOBJECTS_RESPONSE: {
          this.sobjects.next(event.payload as string[]);
          break;
        }
        case MessageType.SOBJECT_METADATA_RESPONSE: {
          this.sobjectMetadata.next(event.payload);
          break;
        }
        case MessageType.CONNECTION_CHANGED: {
          this.loadSObjectDefinitions();
          if (this.latestSObjectName) {
            this.loadSObjectMetatada(this.latestSObjectName);
          }
        }
        case MessageType.RUN_SOQL_QUERY_DONE: {
          this.queryRunState.next(false);
        }
        default:
          break;
      }
    }
  }

  loadSObjectDefinitions() {
    this.messageService.sendMessage({ type: MessageType.SOBJECTS_REQUEST });
  }

  loadSObjectMetatada(sobjectName: string) {
    this.latestSObjectName = sobjectName;
    this.messageService.sendMessage({
      type: MessageType.SOBJECT_METADATA_REQUEST,
      payload: sobjectName
    });
  }
}
