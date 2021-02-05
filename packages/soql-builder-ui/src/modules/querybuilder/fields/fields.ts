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
      // COUNT() and other fields are mutually exclusive
      if (e.detail.value.toLowerCase() === 'count()') {
        this.removeNonCountSelections();
      } else {
        this.removeCountSelection();
      }
      const fieldSelectedEvent = new CustomEvent('fields__selected', {
        detail: { field: e.detail.value }
      });
      this.dispatchEvent(fieldSelectedEvent);
    }
  }

  handleFieldRemoved(e) {
    e.preventDefault();
    const fieldRemovedEvent = new CustomEvent('fields__removed', {
      detail: { field: e.target.dataset.field }
    });
    this.dispatchEvent(fieldRemovedEvent);
  }

  removeNonCountSelections() {
    this.selectedFields.forEach(field => {
      if (field.toLowerCase() !== 'count()') {
        const fieldRemovedEvent = new CustomEvent('fields__removed', {
          detail: { field }
        });
        this.dispatchEvent(fieldRemovedEvent);
      }
    });
  }

  removeCountSelection() {
    this.selectedFields.forEach(field => {
      if (field.toLowerCase() === 'count()') {
        const fieldRemovedEvent = new CustomEvent('fields__removed', {
          detail: { field }
        });
        this.dispatchEvent(fieldRemovedEvent);
      }
    });
  }
}
