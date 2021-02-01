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

import { ToolingModelService } from '../services/toolingModelService';
// eslint-disable-next-line no-unused-vars
import { IMessageService } from '../services/message/iMessageService';
import {
  MessageType,
  SoqlEditorEvent
} from '../services/message/soqlEditorEvent';
import {
  recoverableErrors,
  recoverableFieldErrors,
  recoverableFromErrors,
  recoverableLimitErrors,
  recoverableWhereErrors
} from '../error/errorModel';
import { getBodyClass } from '../services/globals';
import { ToolingModelJson } from '../services/model';

export default class App extends LightningElement {
  @track
  sObjects: string[] = [];
  @track
  fields: string[] = [];
  toolingSDK: ToolingSDK;
  modelService: ToolingModelService;
  messageService: IMessageService;
  theme = 'light';
  sobjectMetadata: any;

  errorMessages: string[] = [];
  unsupportedMessages: string[] = [];
  dismissEditWarning = false;

  get blockQueryBuilder() {
    return (
      (this.unsupportedMessages.length || this.errorMessages.length) &&
      this.dismissEditWarning === false
    );
  }
  hasRecoverableFieldsError = false;
  hasRecoverableFromError = false;
  hasRecoverableLimitError = false;
  hasRecoverableWhereError = false;
  hasRecoverableError = true;
  hasUnrecoverableError = false;
  isFromLoading = false;
  isFieldsLoading = false;
  isQueryRunning = false;

  @track
  query: ToolingModelJson = ToolingModelService.toolingModelTemplate;

  constructor() {
    super();
    this.messageService = MessageServiceFactory.create();
    this.toolingSDK = new ToolingSDK(this.messageService);
    this.modelService = new ToolingModelService(this.messageService);
  }

  connectedCallback() {
    this.modelService.UIModel.subscribe(this.uiModelSubscriber.bind(this));

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
      this.sobjectMetadata = sobjectMetadata;
    });

    this.toolingSDK.queryRunState.subscribe(() => {
      this.isQueryRunning = false;
    });
    this.loadSObjectDefinitions();
    this.modelService.restoreViewState();
  }

  renderedCallback() {
    const themeClass = getBodyClass();
    if (themeClass.indexOf('vscode-dark') > -1) {
      this.theme = 'dark';
    } else if (themeClass.indexOf('vscode-high-contrast') > -1) {
      this.theme = 'contrast';
    }
  }

  uiModelSubscriber(newQuery: ToolingModelJson) {
    // only re-render if incoming soql statement is different
    if (this.query.originalSoqlStatement !== newQuery.originalSoqlStatement) {
      this.inspectErrors(newQuery.errors);
      this.inspectUnsupported(newQuery.unsupported);
      this.loadSObjectMetadata(newQuery);
      this.query = newQuery;
    }
  }

  loadSObjectDefinitions() {
    this.isFromLoading = true;
    this.toolingSDK.loadSObjectDefinitions();
  }

  loadSObjectMetadata(newQuery) {
    const previousSObject = this.query ? this.query.sObject : '';
    const newSObject = newQuery.sObject;
    // if empty sobject, clear fields
    if (!newSObject.length) {
      this.fields = [];
      return;
    }
    // if empty previous sobject or else new sobject does not match previous
    if (previousSObject.length === 0 || previousSObject !== newSObject) {
      this.onSObjectChanged(newSObject);
    }
    // if no fields have been downloaded yet
    else if (
      previousSObject === newSObject &&
      this.fields.length === 0 &&
      this.isFieldsLoading === false
    ) {
      this.onSObjectChanged(newSObject);
    }
  }

  inspectUnsupported(unsupported) {
    this.unsupportedMessages = unsupported
      .filter((unsup) => unsup.reason !== 'unmodeled:empty-condition')
      .map((unsup, index) => {
        // sometimes these unsupported syntax issues come in as a string and not an object.
        // see W-8793884
        const newunsup = typeof unsup === 'string' ? { reason: unsup } : unsup;
        newunsup.reason = newunsup.reason || 'unknown';
        newunsup.index = index; // necessary for LWC
        return newunsup;
      });
  }

  inspectErrors(errors) {
    this.hasRecoverableFieldsError = false;
    this.hasRecoverableFromError = false;
    this.hasRecoverableLimitError = false;
    this.hasUnrecoverableError = false;
    this.hasRecoverableWhereError = false;
    let messages = [];
    errors.forEach((error) => {
      if (recoverableErrors[error.type]) {
        this.hasRecoverableError = true;
        if (recoverableFieldErrors[error.type]) {
          this.hasRecoverableFieldsError = true;
        }
        if (recoverableLimitErrors[error.type]) {
          this.hasRecoverableLimitError = true;
        }
        if (recoverableFromErrors[error.type]) {
          this.hasRecoverableFromError = true;
        }
        if (recoverableWhereErrors[error.type]) {
          this.hasRecoverableWhereError = true;
        }
      } else {
        this.hasUnrecoverableError = true;
      }
      messages.push(error.message);
    });
    this.errorMessages = messages;
  }
  /* ---- SOBJECT HANDLERS ---- */
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
  /* ---- FIELD HANDLERS ---- */
  handleFieldSelected(e) {
    this.modelService.addField(e.detail.field);
  }

  handleFieldRemoved(e) {
    this.modelService.removeField(e.detail.field);
  }
  /* ---- ORDER BY HANDLERS ---- */
  handleOrderBySelected(e) {
    this.modelService.addUpdateOrderByField(e.detail);
  }
  handleOrderByRemoved(e) {
    this.modelService.removeOrderByField(e.detail.field);
  }
  /* ---- LIMIT HANDLERS ---- */
  handleLimitChanged(e) {
    this.modelService.changeLimit(e.detail.limit);
  }
  /* ---- WHERE HANDLERS ---- */
  handleWhereSelection(e) {
    this.modelService.upsertWhereFieldExpr(e.detail);
  }
  handleAndOrSelection(e) {
    this.modelService.setAndOr(e.detail);
  }
  handleRemoveWhereCondition(e) {
    this.modelService.removeWhereFieldCondition(e.detail);
  }

  /* MISC HANDLERS */

  handleDismissEditWarning() {
    this.dismissEditWarning = true;
  }

  handleRunQuery() {
    this.isQueryRunning = true;
    const runQueryEvent: SoqlEditorEvent = { type: MessageType.RUN_SOQL_QUERY };
    this.messageService.sendMessage(runQueryEvent);
  }
}
