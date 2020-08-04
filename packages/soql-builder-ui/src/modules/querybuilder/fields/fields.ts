import { LightningElement, api } from 'lwc';
export default class Fields extends LightningElement {
  @api fields: string[];
  @api selectedFields: string[] = [];

  handleFieldSelection(e) {
    e.preventDefault();
    const fieldSelectedEvent = new CustomEvent('fieldselected', {
      detail: { field: e.target.value }
    });
    this.dispatchEvent(fieldSelectedEvent);
  }

  handleFieldRemoved(e) {
    e.preventDefault();
    const fieldRemovedEvent = new CustomEvent('fieldremoved', {
      detail: { field: e.target.dataset.field }
    });
    this.dispatchEvent(fieldRemovedEvent);
  }
}
