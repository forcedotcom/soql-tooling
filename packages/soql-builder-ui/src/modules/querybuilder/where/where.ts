/*
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 */

import { api, LightningElement } from 'lwc';

export default class Where extends LightningElement {
  @api whereFields: string[];
  // _local_list of where claused to render
  // API is different than whats rendered
  // add a phantom where group to render, only until the criteria is filled out

  // TODO: we may want to debounce this with RXJS
  // send the event target info and throttle only on text input?
  handleSelectionEvent(e) {
    e.preventDefault();
    const fieldEl = this.template.querySelector('[data-el-where-field]');
    const OperatorEl = this.template.querySelector('[data-el-where-operator]');
    const criteriaEl = this.template.querySelector('[data-el-where-criteria]');

    if (fieldEl.value && OperatorEl.value) {
      console.log('change event', {
        field: fieldEl.value,
        operator: OperatorEl.value,
        criteria: criteriaEl.value
      });
      const whereSelectionEvent = new CustomEvent('whereselection', {
        detail: {
          field: fieldEl.value,
          operator: OperatorEl.value,
          criteria: criteriaEl.value
          //index: update or delete
        }
      });
      this.dispatchEvent(whereSelectionEvent);
    }
  }
}
