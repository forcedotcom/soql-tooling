import { LightningElement, track } from 'lwc';
import { ToolingService } from '../services/toolingService';
// eslint-disable-next-line no-unused-vars
import { ModelService, SoqlQueryModel } from '../services/modelService';

export default class App extends LightningElement {
  sObjects: string[];
  @track fields: string[] = [];
  toolingService = new ToolingService();
  modelService = new ModelService();

  @track
  query: SoqlQueryModel;


  connectedCallback() {
    this.modelService.query.subscribe({
      next: (query) => {
        this.query = query;
    }});
    this.sObjects = this.toolingService.sObjects;
  }

  renderedCallback() {
    if (this.query && this.query.sObject && this.query.sObject.length) {
      this.fields = this.toolingService.getCompletionItemsFor(this.query.sObject);
    }
  }

  handleObjectChange(e) {
    this.fields = this.toolingService.getCompletionItemsFor(e.detail.selectedSobject);
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
