import { LightningElement, track } from 'lwc';
import { ToolingService } from '../../../toolingService/toolingService';
import { ModelService } from '../../../modelService/modelService';

export default class App extends LightningElement {
  sObjects: string[];
  @track fields: string[] = [];
  toolingService = new ToolingService();
  modelService = new ModelService();

  @track
  model = this.modelService.getQuery();

  connectedCallback() {
    this.sObjects = this.toolingService.sObjects;
  }

  renderedCallback() {
    if (this.model && this.model.sObject && this.model.sObject.length) {
      this.fields = this.toolingService.getCompletionItemsFor(this.model.sObject);
    }
  }

  handleObjectChange(e) {
    const sObject = e.detail.selectedSobject;
    this.fields = this.toolingService.getCompletionItemsFor(sObject);
    this.model = this.modelService.setSObject(sObject);
  }

  handleFieldSelected(e) {
    const field = e.detail.field;
    this.model = this.modelService.addField(field);
  }

  handleFieldRemoved(e) {
    const field = e.detail.field;
    this.model = this.modelService.removeField(field);
  }

  handleSave() {
    this.modelService.save();
  }
}
