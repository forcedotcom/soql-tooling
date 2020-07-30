import { LightningElement, api } from 'lwc';
export default class Fields extends LightningElement {
  @api fields: string[];
  selectedFields: string[] = [];

  handleFieldSelection(e) {
    e.preventDefault();
    this.selectedFields = [...e.target.options]
      .filter((option) => option.selected)
      .map((option) => option.value);
  }
}
