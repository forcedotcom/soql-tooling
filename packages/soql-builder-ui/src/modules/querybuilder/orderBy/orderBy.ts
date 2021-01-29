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
  selectPlaceHolderText = 'Search fields...'; //i18n

  get defaultOptionText() {
    // TODO: i18n
    return this.isLoading ? 'Loading...' : 'Select fields...';
  }

  handleOrderBySelected(e) {
    e.preventDefault();
    const orderbyFieldEl = this.template.querySelector(
      'querybuilder-custom-select'
    );
    const orderEl = this.template.querySelector('[data-el-orderby-order]');
    const nullsEl = this.template.querySelector('[data-el-orderby-nulls]');
    if (
      orderbyFieldEl &&
      orderbyFieldEl.value[0] &&
      orderbyFieldEl.value.length
    ) {
      const orderBySelectedEvent = new CustomEvent('orderbyselected', {
        detail: {
          field: orderbyFieldEl.value[0],
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
