/*
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 */

import { LightningElement, track } from 'lwc';
import { ToolingSDK } from '../services/toolingSDK';
import { MessageServiceFactory } from '../services/message/messageServiceFactory';

// eslint-disable-next-line no-unused-vars
import {
  ToolingModelService,
  ToolingModelJson
} from '../services/toolingModelService';
import { IMessageService } from '../services/message/iMessageService';
import {
  MessageType,
  SoqlEditorEvent
} from '../services/message/soqlEditorEvent';

export default class App extends LightningElement {
  @track
  sObjects: string[] = [];
  @track
  fields: string[] = [];
  toolingSDK: ToolingSDK;
  modelService: ToolingModelService;
  messageService: IMessageService;

  @track
  query: ToolingModelJson;

  constructor() {
    super();
    this.messageService = MessageServiceFactory.create();
    this.toolingSDK = new ToolingSDK(this.messageService);
    this.modelService = new ToolingModelService(this.messageService);
  }

  connectedCallback() {
    this.modelService.query.subscribe((newQuery: ToolingModelJson) => {
      const previousSObject = this.query ? this.query.sObject : undefined;
      this.query = newQuery;
      if (previousSObject !== this.query.sObject) {
        this.onSObjectChanged(this.query.sObject);
      }
    });

    this.toolingSDK.sobjects.subscribe((objs: string[]) => {
      this.sObjects = objs;
    });

    this.toolingSDK.sobjectMetadata.subscribe((sobjectMetadata: any) => {
      this.fields =
        sobjectMetadata && sobjectMetadata.fields
          ? sobjectMetadata.fields.map((f) => f.name)
          : [];
    });

    this.toolingSDK.loadSObjectDefinitions();
    this.modelService.restoreViewState();
  }

  handleObjectChange(e) {
    const selectedSObjectName = e.detail.selectedSobject;
    this.onSObjectChanged(selectedSObjectName);
  }

  onSObjectChanged(sobjectName: string) {
    this.fields = [];
    if (sobjectName) {
      this.toolingSDK.loadSObjectMetatada(sobjectName);
    }
    this.modelService.setSObject(sobjectName);
  }

  handleFieldSelected(e) {
    this.modelService.addField(e.detail.field);
  }

  handleFieldRemoved(e) {
    this.modelService.removeField(e.detail.field);
  }

  handleRunQuery() {
    const runQueryEvent: SoqlEditorEvent = { type: MessageType.RUN_SOQL_QUERY };
    this.messageService.sendMessage(runQueryEvent);
  }
}
