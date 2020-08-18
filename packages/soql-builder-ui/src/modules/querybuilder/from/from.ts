import { LightningElement, api } from 'lwc';

export default class From extends LightningElement {
  @api sobjects: string[];
  @api selected: string;
  get filteredSObjects() {
    return this.sobjects.filter((sobject) => {
      return sobject !== this.selected;
    });
  }

  get hasSelected() {
    return !!this.selected;
  }

  handleSobjectSelection(e) {
    e.preventDefault();
    const selectedSobject = e.target.value;
    const sObjectSelected = new CustomEvent('objectselected', {
      detail: { selectedSobject }
    });
    this.dispatchEvent(sObjectSelected);
  }
}
