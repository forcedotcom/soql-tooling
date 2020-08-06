import { LightningElement, track } from 'lwc';
import { ToolingService } from '../../../toolingService/toolingService';
import { ModelService } from '../../../modelService/modelService';

export default class App extends LightningElement {
  sObjects: string[];
  @track fields: string[] = [];
  toolingService = new ToolingService();
  modelService = new ModelService();

  @track
  query = this.modelService.getQuery();

  connectedCallback() {
    this.sObjects = this.toolingService.sObjects;
  }

  renderedCallback() {
    if (this.query && this.query.sObject && this.query.sObject.length) {
      this.fields = this.toolingService.getCompletionItemsFor(this.query.sObject);
    }
  }

  handleObjectChange(e) {
    const sObject = e.detail.selectedSobject;
    this.fields = this.toolingService.getCompletionItemsFor(sObject);
    this.query = this.modelService.setSObject(sObject);
  }

  handleFieldSelected(e) {
    const field = e.detail.field;
    this.query = this.modelService.addField(field);
  }

  handleFieldRemoved(e) {
    const field = e.detail.field;
    this.query = this.modelService.removeField(field);
  }

  handleSave() {
    this.modelService.save();
  }
}
