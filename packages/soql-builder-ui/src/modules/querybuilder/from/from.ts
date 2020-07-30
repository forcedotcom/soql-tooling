import { LightningElement, api } from 'lwc';

export default class From extends LightningElement {
  @api sobjects;

  handleSobjectSelection(e) {
    e.preventDefault();
    const selectedSobject = e.target.value;
    const sObjectSelected = new CustomEvent('objectselected', {
      detail: { selectedSobject }
    });
    this.dispatchEvent(sObjectSelected);
  }
}
