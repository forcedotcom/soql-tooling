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

  handleOrderBySelected(e) {
    e.preventDefault();
    const orderbyEl = this.template.querySelector('[data-el-orderby-field]');
    const orderEl = this.template.querySelector('[data-el-orderby-order]');
    const nullsEl = this.template.querySelector('[data-el-orderby-nulls]');
    if (orderbyEl && orderbyEl.value && orderbyEl.value.length) {
      const orderBySelectedEvent = new CustomEvent('orderbyselected', {
        detail: {
          field: orderbyEl.value,
          order: orderEl.value,
          nulls: nullsEl.value
        }
      });
      this.dispatchEvent(orderBySelectedEvent);
    }
  }

  handleOrderByRemoved(e) {
    e.preventDefault();
    const orderByRemovedEvent = new CustomEvent('orderbyremoved', {
      detail: { field: e.target.dataset.field }
    });
    this.dispatchEvent(orderByRemovedEvent);
  }
}
