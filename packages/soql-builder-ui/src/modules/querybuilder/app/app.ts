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

export default class App extends LightningElement {
  @track
  sObjects: string[] = [];
  @track
  fields: string[] = [];
  toolingSDK: ToolingSDK;
  modelService: ToolingModelService;

  @track
  query: ToolingModelJson;

  constructor() {
    super();
    const messageService: IMessageService = MessageServiceFactory.create();
    this.toolingSDK = new ToolingSDK(messageService);
    this.modelService = new ToolingModelService(messageService);
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

  renderedCallback() {
    //  this.synchronizeWithSobject();
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
    // TODO: Hook up run query with the connection object W-7989627
    /*
     leaving this for standalone app development
     saves to local storage
     */
  }
}
