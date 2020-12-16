/*
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 */

import { LightningElement, api } from 'lwc';
import { JsonMap } from '@salesforce/ts-types';
export default class OrderBy extends LightningElement {
  @api orderByFields: string[];
  @api selectedOrderByFields: JsonMap[] = [];
  @api hasError = false; // currently not used, no specific order by errors
  @api isLoading = false;

  get defaultOptionText() {
    // TODO: i18n
    return this.isLoading ? 'Loading...' : 'Select fields...';
  }

  handleOrderBySelected(e) {
    e.preventDefault();
    const orderbyEl = this.template.querySelector('[data-el-orderby-field]');
    const orderEl = this.template.querySelector('[data-el-orderby-order]');
    const nullsEl = this.template.querySelector('[data-el-orderby-nulls]');
    if (orderbyEl && orderbyEl.value && orderbyEl.value.length) {
      const orderBySelectedEvent = new CustomEvent('orderby__selected', {
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
    const orderByRemovedEvent = new CustomEvent('orderby__removed', {
      detail: { field: e.target.dataset.field }
    });
    this.dispatchEvent(orderByRemovedEvent);
  }
}
