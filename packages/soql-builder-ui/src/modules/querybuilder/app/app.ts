import { LightningElement } from 'lwc';
import { ToolingService } from '../../../toolingService/toolingService';

export default class App extends LightningElement {
  sObjects: string[];

  connectedCallback() {
    let toolingService = new ToolingService();
    this.sObjects = toolingService.sObjects;
    console.log('sObjects', this.sObjects);
  }
}
