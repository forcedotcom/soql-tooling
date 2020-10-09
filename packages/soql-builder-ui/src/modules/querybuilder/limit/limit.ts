/*
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 */

import { LightningElement, api } from 'lwc';

export default class Limit extends LightningElement {
  @api hasError = false;
  @api limit;

  handleLimitChange(e) {
    e.preventDefault();
    const limit = e.target.value;
    // eslint-disable-next-line no-debugger
    debugger;
    const sObjectSelected = new CustomEvent('limitchanged', {
      detail: { limit }
    });
    this.dispatchEvent(sObjectSelected);
  }
}
