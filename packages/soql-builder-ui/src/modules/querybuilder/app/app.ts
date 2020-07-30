import { LightningElement, track } from 'lwc';
import { ToolingService } from '../../../toolingService/toolingService';

export default class App extends LightningElement {
  sObjects: string[];
  @track fields: string[] = [];
  toolingService = new ToolingService();

  connectedCallback() {
    this.sObjects = this.toolingService.sObjects;
    console.log('sObjects', this.sObjects);
  }

  handleObjectChange(e) {
    const sObject = e.detail.selectedSobject;
    this.fields = this.toolingService.getCompletionItemsFor(sObject);
    console.log('Fields for object', this.fields);
  }
}
