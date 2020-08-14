import { LightningElement } from 'lwc';
export default class Header extends LightningElement {
  handleSaveQuery(e: Event) {
    e.preventDefault();
    const saveEvent = new CustomEvent('save');
    this.dispatchEvent(saveEvent);
  }
}
