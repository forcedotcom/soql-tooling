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

import {
  ToolingModelService,
  // eslint-disable-next-line no-unused-vars
  ToolingModelJson
} from '../services/toolingModelService';
// eslint-disable-next-line no-unused-vars
import { IMessageService } from '../services/message/iMessageService';
import {
  recoverableErrors,
  recoverableFieldErrors,
  recoverableFromErrors
} from '../error/errorModel';

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
    return this.hasUnrecoverableError || this.hasUnsupported;
  }
  hasRecoverableFieldsError = false;
  hasRecoverableFromError = false;
  hasRecoverableError = true;
  hasUnrecoverableError = true;
  isFromLoading = false;
  isFieldsLoading = false;

  @track
  query: ToolingModelJson = ToolingModelService.toolingModelTemplate;

  constructor() {
    super();
    const messageService: IMessageService = MessageServiceFactory.create();
    this.toolingSDK = new ToolingSDK(messageService);
    this.modelService = new ToolingModelService(messageService);
  }

  connectedCallback() {
    this.modelService.query.subscribe((newQuery: ToolingModelJson) => {
      qthis.inspectErrors(newQuery.errors);
      if (this.hasUnrecoverableError === false) {
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

  loadSObjectDefinitions() {
    this.isFromLoading = true;
    this.toolingSDK.loadSObjectDefinitions();
  }

  loadSObjectMetadata(newQuery) {
    const previousSObject = this.query ? this.query.sObject : '';
    const newSObject = newQuery.sObject;
    if (!newSObject.length) {
      this.fields = [];
      return;
    }
    if (previousSObject.length === 0 || previousSObject !== newSObject) {
      this.onSObjectChanged(newSObject);
    } else if (
      previousSObject === newSObject &&
      this.fields.length === 0 &&
      this.isFieldsLoading === false
    ) {
      this.onSObjectChanged(newSObject);
    }
  }

  inspectErrors(errors) {
    this.hasRecoverableFieldsError = false;
    this.hasRecoverableFromError = false;
    this.hasUnrecoverableError = false;
    errors.forEach((error) => {
      console.log('     errors: ', error.type);
      // replace with imported types after fernando's work
      if (recoverableErrors[error.type]) {
        this.hasRecoverableError = true;
        if (recoverableFieldErrors[error.type]) {
          this.hasRecoverableFieldsError = true;
        }
        if (recoverableFromErrors[error.type]) {
          this.hasRecoverableFromError = true;
        }
      } else {
        this.hasUnrecoverableError = true;
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
