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
    const sObjectSelected = new CustomEvent('limit__changed', {
      detail: { limit }
    });
    this.dispatchEvent(sObjectSelected);
  }
}
