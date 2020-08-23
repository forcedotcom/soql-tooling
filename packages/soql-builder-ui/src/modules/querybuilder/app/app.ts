/* 
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *   
 */

import { LightningElement, track, api } from 'lwc';
import { ToolingSDK } from '../services/toolingSDK';
// eslint-disable-next-line no-unused-vars
import {
  ToolingModelService,
  ToolingModelJson
} from '../services/toolingModelService';

export default class App extends LightningElement {
  @track
  public sObjects: string[];
  @track 
  public fields: string[] = [];
  toolingSDK = new ToolingSDK();
  modelService = new ToolingModelService();

  @track
  query: ToolingModelJson;

  connectedCallback() {
    this.modelService.query.subscribe((query: ToolingModelJson) => {
      this.query = query;
      this.synchronizeWithSobject();
    } );
    this.sObjects = this.toolingSDK.sObjects;
  }

  renderedCallback() {
    this.synchronizeWithSobject();
  }

  synchronizeWithSobject() {
    if (this.query && this.query.sObject && this.query.sObject.length) {
      this.fields = this.toolingSDK.getCompletionItemsFor(this.query.sObject);
    }
  }

  handleObjectChange(e) {
    this.fields = this.toolingSDK.getCompletionItemsFor(
      e.detail.selectedSobject
    );
    this.modelService.setSObject(e.detail.selectedSobject);
  }

  handleFieldSelected(e) {
    this.modelService.addField(e.detail.field);
  }

  handleFieldRemoved(e) {
    this.modelService.removeField(e.detail.field);
  }

  handleSave() {
    this.modelService.save();
  }
}
