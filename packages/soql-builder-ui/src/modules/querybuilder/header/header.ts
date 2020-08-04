import { LightningElement } from 'lwc';

export default class Header extends LightningElement {
    handleSaveQuery(e) {
        e.preventDefault();
        const saveEvent = new CustomEvent('save');
        this.dispatchEvent(saveEvent);
      }
}
