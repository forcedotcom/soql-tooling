/*
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 */

import { LightningElement, api } from 'lwc';
export default class Fields extends LightningElement {
  @api fields: string[];
  @api selectedFields: string[] = [];
  @api hasError = false;
  @api isLoading = false;

  get defaultOptionText() {
    return this.isLoading ? '...loading...' : '--- Select Fields ---';
  }

  handleFieldSelection(e) {
    e.preventDefault();
    const value = e.target.value;
    if (value && value.length) {
      const fieldSelectedEvent = new CustomEvent('fieldselected', {
        detail: { field: e.target.value }
      });
      this.dispatchEvent(fieldSelectedEvent);
    }
  }

  handleFieldRemoved(e) {
    e.preventDefault();
    const fieldRemovedEvent = new CustomEvent('fieldremoved', {
      detail: { field: e.target.dataset.field }
    });
    this.dispatchEvent(fieldRemovedEvent);
  }
}
