/* 
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *   
 */

import { LightningElement } from 'lwc';
export default class Header extends LightningElement {
  handleSaveQuery(e: Event) {
    e.preventDefault();
    const saveEvent = new CustomEvent('save');
    this.dispatchEvent(saveEvent);
  }
}
