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

  get blockQueryBuilder() {
    return this.hasUnknownError || this.hasUnsupported;
  }
  hasFieldsError = false;
  hasFromError = false;
  hasUnknownError = true;
  isFromLoading = false;
  isFieldsLoading = false;

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
      console.log('incoming query change: ', JSON.stringify(newQuery));
      this.inspectErrors(newQuery.errors);
      if (this.hasUnknownError === false) {
        this.loadSObjectMetadata(newQuery);
      }
      this.query = newQuery;
    });

    this.toolingSDK.sobjects.subscribe((objs: string[]) => {
      this.isFromLoading = false;
      this.sObjects = objs;
    });
    this.toolingSDK.sobjectMetadata.subscribe((sobjectMetadata: any) => {
      this.isFieldsLoading = false;
      this.fields =
        sobjectMetadata && sobjectMetadata.fields
          ? sobjectMetadata.fields.map((f) => f.name)
          : [];
    });
    this.loadSObjectDefinitions();
    this.modelService.restoreViewState();
  }

  renderedCallback() {
    //  this.synchronizeWithSobject();
  }

  loadSObjectDefinitions() {
    this.isFromLoading = true;
    this.toolingSDK.loadSObjectDefinitions();
  }

  loadSObjectMetadata(newQuery) {
    console.log('loadSObjectMetadata: ');
    // need to handle a new sobject or a change in sobject;
    const previousSObject = this.query ? this.query.sObject : '';
    const newSObject = newQuery.sObject;
    if (!newSObject.length) {
      console.log('loadSObjectMetadata: ', 'newSObject is empty');
      this.fields = [];
      return;
    }
    if (previousSObject.length === 0 || previousSObject !== newSObject) {
      console.log(
        'loadSObjectMetadata: ',
        previousSObject.length,
        previousSObject !== newSObject,
        previousSObject,
        newSObject
      );
      this.onSObjectChanged(newSObject);
    } else if (
      previousSObject === newSObject &&
      this.fields.length === 0 &&
      this.isFieldsLoading === false
    ) {
      console.log('loading sobject metadata because fields are empty');
      this.onSObjectChanged(newSObject);
    } else {
      console.log('loadSObjectMetadata: did not pass tests');
    }
  }

  inspectErrors(errors) {
    this.hasFieldsError = false;
    this.hasFromError = false;
    this.hasUnknownError = false;
    console.log('inspecting errors: ', JSON.stringify(errors));
    errors.forEach((error) => {
      console.log('     errors: ', error.type);
      // replace with imported types after fernando's work
      if (error.type === 'NOSELECTIONS') {
        console.log('    hasFieldsError');
        this.hasFieldsError = true;
      } else if (error.type === 'INCOMPLETEFROM') {
        console.log('    hasFromError');
        this.hasFromError = true;
      } else {
        console.log('    hasUnknownError');
        this.hasUnknownError = true;
      }
    });
  }

  handleObjectChange(e) {
    const selectedSObjectName = e.detail.selectedSobject;
    this.onSObjectChanged(selectedSObjectName);
    // when triggered by the ui, send message
    this.modelService.setSObject(selectedSObjectName);
  }

  onSObjectChanged(sobjectName: string) {
    if (sobjectName) {
      this.fields = [];
      this.isFieldsLoading = true;
      this.toolingSDK.loadSObjectMetatada(sobjectName);
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
