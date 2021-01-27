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
  @api errorMessages = [];
  get hasErrors() {
    return this.errorMessages.length > 0;
  }
  get headerClasses() {
    return this.hasErrors ? 'warning-notification' : '';
  }
  get triggerText() {
    return this.showErrors ? 'Hide errors' : 'Show errors';
  }
  showErrors = false;

  get isButtonDisabled() {
    return this.hasErrors || this.isRunning;
  }

  get buttonClasses() {
    return this.isButtonDisabled ? 'btn--disabled' : '';
  }

  get buttonText() {
    return this.isRunning ? 'Running...' : 'Run Query';
  }

  handleShowErrors(e: Event) {
    e.preventDefault();
    this.showErrors = !this.showErrors;
  }

  handleRunQuery(e: Event) {
    e.preventDefault();
    if (this.isButtonDisabled) {
      return;
    }
    const runEvent = new CustomEvent('header__run_query');
    this.dispatchEvent(runEvent);
  }
}
