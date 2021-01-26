/*
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 */

import { LightningElement, api } from 'lwc';
export default class Header extends LightningElement {
  @api isRunning = false;
  @api unsupportedMessages = [];
  @api errorMessages = [];
  get hasErrorsOrUnsupported() {
    return this.unsupportedMessages.length + this.errorMessages.length > 0;
  }
  get getHeaderClasses() {
    return this.hasErrorsOrUnsupported ? 'syntax-warning' : '';
  }
  get triggerText() {
    return this.showErrors ? 'Hide errors' : 'Show errors';
  }
  showErrors = false;

  handleShowErrors(e: Event) {
    e.preventDefault();
    this.showErrors = !this.showErrors;
  }

  handleRunQuery(e: Event) {
    e.preventDefault();
    const runEvent = new CustomEvent('header__run_query');
    this.dispatchEvent(runEvent);
  }
}
