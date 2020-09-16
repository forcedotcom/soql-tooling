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

  get hasUnsupported() {
    return this.query && this.query.unsupported
      ? this.query.unsupported.length
      : 0;
  }

  hasFieldsError = false;
  hasFromError = false;
  hasUnknownError = true;

  @track
  query: ToolingModelJson;

  constructor() {
    super();
    const messageService: IMessageService = MessageServiceFactory.create();
    this.toolingSDK = new ToolingSDK(messageService);
    this.modelService = new ToolingModelService(messageService);
    this.query = this.modelService.toolingModelTemplate;
  }

  connectedCallback() {
    this.modelService.query.subscribe((newQuery: ToolingModelJson) => {
      this.inspectErrors(this.query.errors);
      if (this.hasUnknownError === false) {
        this.loadSObjectMetadata(newQuery);
      }
      console.log('incoming query change: ', JSON.stringify(this.query));
      this.query = newQuery;
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

  loadSObjectMetadata(newQuery) {
    // need to handle a new sobject or a change in sobject;
    const previousSObject = this.query ? this.query.sObject : '';
    const newSObject = newQuery.sObject;
    if (!newSObject.length) {
      return;
    }
    if (previousSObject.length === 0 || previousSObject !== newSObject) {
      this.toolingSDK.loadSObjectMetatada(newSObject);
    }
  }

  inspectErrors(errors) {
    this.hasFieldsError = false;
    this.hasFromError = false;
    this.hasUnknownError = false;
    errors.forEach((error) => {
      // replace with imported types after fernando's work
      if (error.type === 'NOSELECTIONS') {
        this.hasFieldsError = true;
      } else if (error.type === 'INCOMPLETEFROM') {
        this.hasFromError = true;
      } else {
        this.hasUnknownError = true;
      }
    });
  }

  handleObjectChange(e) {
    const selectedSObjectName = e.detail.selectedSobject;
    this.onSObjectChanged(selectedSObjectName);
  }

  onSObjectChanged(sobjectName: string) {
    this.fields = [];
    if (sobjectName) {
      this.toolingSDK.loadSObjectMetatada(sobjectName);
      this.modelService.setSObject(sobjectName);
    }
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
