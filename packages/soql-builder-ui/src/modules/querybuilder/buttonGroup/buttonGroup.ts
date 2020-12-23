
/*
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 */

import { api, LightningElement, track } from 'lwc';
import { tsMethodSignature } from '../../../../../../../../Library/Caches/typescript/4.0/node_modules/@babel/types/lib/index';

interface ButtonData {
  key: string;
  label: string;
  value: any;
  className: string;
}

interface ButtonValue {
  label: string;
  value: any;
}

export default class ButtonGroup extends LightningElement {
  @api selectedIndex = '-1';
  @api get buttonValues() {
    return this.buttonData
      ? this.buttonData.map(data => { return { label: data.label, value: JSON.parse(data.value) }; })
      : new Array<ButtonValue>();
  }
  set buttonValues(_buttonValues: ButtonValue[]) {
    this.buttonData = _buttonValues.map(bv => {
      const idx = _buttonValues.indexOf(bv);
      return { label: bv.label, value: JSON.stringify(bv.value), key: `${idx}`, className: this.getClassName(idx) };
    });
  }
  @track
  buttonData: ButtonData[];

  renderedCallback() {
    this.updateClasses();
  }

  updateClasses(): void {
    this.buttonData.forEach((data, index) =>
      data.className = this.getClassName(index)
    );
  }

  getClassName(idx: number): string {
    let classList = "btn";
    if (this.isFirst(idx)) {
      classList += " btn--first";
    }
    if (this.isLast(idx)) {
      classList += " btn--last";
    }
    if (this.isSelected(idx)) {
      classList += " btn--selected";
    }
    return classList;
  }

  isFirst(index: number): boolean {
    return index === 0;
  }
  isLast(index: number): boolean {
    return index === this.buttonValues.length - 1;
  }
  isSelected(index: number): boolean {
    return index === parseInt(this.selectedIndex);
  }

  handleButtonClicked(e) {
    this.selectedIndex = e.currentTarget.attributes.index.value;
    const value = JSON.parse(e.currentTarget.attributes.value.value);
    this.updateClasses();
    const event = new CustomEvent('selection__changed', {
      detail: {
        selection: parseInt(this.selectedIndex),
        value
      }
    });
    this.dispatchEvent(event);
  }
}
