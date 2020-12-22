
/*
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 */

import { api, LightningElement, track } from 'lwc';

export default class ButtonGroup extends LightningElement {
  @api buttonLabels: string[];
  @api selectedIndex = '-1';

  renderedCallback() {
    const buttonElements = this.template.querySelectorAll('button');
    buttonElements.forEach(element => {
      this.applyStyle(element);
    });
  }

  get buttonData() {
    return this.buttonLabels
      ? this.buttonLabels.map(label => {
        return { label: label, key: `${this.buttonLabels.indexOf(label)}` };
      })
      : [];
  }

  applyStyle(element: any) {
    let classList = "btn";
    const idx = parseInt(element.attributes.index.value);
    if (this.isFirst(idx)) {
      classList += " btn--first";
    }
    if (this.isLast(idx)) {
      classList += " btn--last";
    }
    if (this.isSelected(idx)) {
      classList += " btn--selected";
    }
    element.className = classList;
  }

  isFirst(index: number): boolean {
    return index === 0;
  }
  isLast(index: number): boolean {
    return index === this.buttonLabels.length - 1;
  }
  isSelected(index: number): boolean {
    return index === parseInt(this.selectedIndex);
  }

  @api get selection() {
    return parseInt(this.selectedIndex);
  }

  handleButtonClicked(e) {
    this.selectedIndex = e.currentTarget.attributes.index.value;
    const event = new CustomEvent('selection__changed', {
      detail: { selection: this.selection }
    });
    this.dispatchEvent(event);
  }
}
