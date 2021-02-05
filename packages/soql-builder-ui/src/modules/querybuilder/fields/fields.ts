/*
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 */

import { LightningElement, api } from 'lwc';
export default class Fields extends LightningElement {
  @api set fields(fields: string[]) {
    this._displayFields = [
      'COUNT()',
      ...fields
    ];
  }
  get fields() {
    return this._displayFields;
  }
  @api selectedFields: string[] = [];
  @api hasError = false;
  @api isLoading = false;
  selectPlaceHolderText = 'Search fields...'; // TODO: i18n
  _displayFields: string[];

  handleFieldSelection(e) {
    e.preventDefault();
    if (e.detail && e.detail.value) {
      let selection = [];
      // COUNT() and other fields are mutually exclusive
      if (e.detail.value.toLowerCase() === 'count()') {
        selection.push('COUNT()');
      } else {
        selection = this.selectedFields.filter(value => value.toLowerCase() !== 'count()');
        selection.push(e.detail.value);
      }
      const fieldSelectedEvent = new CustomEvent('fields__selected', {
        detail: { fields: selection }
      });
      this.dispatchEvent(fieldSelectedEvent);
    }
  }

  handleFieldRemoved(e) {
    e.preventDefault();
    const fieldRemovedEvent = new CustomEvent('fields__selected', {
      detail: { fields: this.selectedFields.filter(value => value !== e.target.dataset.field) }
    });
    this.dispatchEvent(fieldRemovedEvent);
  }


}
