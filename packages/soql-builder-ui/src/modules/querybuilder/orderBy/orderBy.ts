/*
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 */

import { LightningElement, api } from 'lwc';
export default class OrderBy extends LightningElement {
  @api orderByFields: string[];
  @api selectedOrderByFields: string[] = [];
  @api hasError = false;
  @api isLoading = false;

  get defaultOptionText() {
    // TODO: i18n
    return this.isLoading ? '...loading...' : '--- Select Fields ---';
  }

  handleFieldSelection(e) {
    e.preventDefault();
    const value = e.target.value;
    if (value && value.length) {
      const orderBySelectedEvent = new CustomEvent('orderbyfieldselected', {
        detail: { field: e.target.value }
      });
      this.dispatchEvent(orderBySelectedEvent);
    }
  }

  handleFieldRemoved(e) {
    e.preventDefault();
    const orderByRemovedEvent = new CustomEvent('orderbyfieldremoved', {
      detail: { field: e.target.dataset.field }
    });
    this.dispatchEvent(orderByRemovedEvent);
  }
}
