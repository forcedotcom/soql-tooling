import { LightningElement, track } from 'lwc';
import { ToolingSDK } from '../services/toolingSDK';
// eslint-disable-next-line no-unused-vars
import {
  ToolingModelService,
  ToolingModelJson
} from '../services/toolingModelService';

export default class App extends LightningElement {
  sObjects: string[];
  @track fields: string[] = [];
  toolingSDK = new ToolingSDK();
  modelService = new ToolingModelService();

  @track
  query: ToolingModelJson;

  connectedCallback() {
    this.modelService.query.subscribe({
      next: (query) => {
        this.query = query;
      }
    });
    this.sObjects = this.toolingSDK.sObjects;
  }

  renderedCallback() {
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
