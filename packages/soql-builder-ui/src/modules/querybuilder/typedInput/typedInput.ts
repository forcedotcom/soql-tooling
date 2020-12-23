/*
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 */

import { Soql } from '@salesforce/soql-model';
import { LightningElement, api } from 'lwc';
import defaultInput from './defaultInput.html';
import booleanInput from './booleanInput.html';

interface Input {
  type: Soql.LiteralType;
  value: string;
}

export default class TypedInput extends LightningElement {
  @api input: Input;

  booleanValues = [
    { label: "True", value: { type: Soql.LiteralType.Boolean, value: 'TRUE' } },
    { label: "False", value: { type: Soql.LiteralType.Boolean, value: 'FALSE' } }
  ];

  render() {
    let theTemplate = defaultInput;
    if (this.input) {
      switch (this.input.type) {
        case Soql.LiteralType.Boolean: {
          theTemplate = booleanInput;
          break;
        }
      }
    }
    return theTemplate;
  }

  get displayValue() {
    if (this.input.type === Soql.LiteralType.String) {
      let displayValue = this.input.value;

      // unquote
      if (displayValue.startsWith("'")) {
        displayValue = displayValue.substring(1);
      }
      if (displayValue.endsWith("'")) {
        displayValue = displayValue.substring(0, displayValue.length - 1);
      }

      // unescape
      displayValue = displayValue.replace(/\\"/g, '"');
      displayValue = displayValue.replace(/\\'/g, '\'');
      displayValue = displayValue.replace(/\\\\/g, '\\');

      return displayValue;
    }
    return this.input.value;
  }

  normalizedValue(displayValue: string): Input {
    if (this.isNullValue(displayValue)) {
      // NULL is special case; broken when intended value is 'NULL' string
      return {
        type: Soql.LiteralType.Null,
        value: 'NULL'
      };
    }

    // string
    let normalized = displayValue;

    // escape
    normalized = normalized.replace(/\\/g, '\\\\');
    normalized = normalized.replace(/'/g, '\\\'');
    normalized = normalized.replace(/"/g, '\\"');

    // quote
    normalized = `'${normalized}'`;

    return {
      type: Soql.LiteralType.String,
      value: normalized
    };
  }

  isNullValue(displayValue: string): boolean {
    return displayValue.trim().toLowerCase() === 'null';
  }

  handleDefaultInput(e) {
    const rawValue = e.currentTarget.value;
    this.input = this.normalizedValue(rawValue);
    this.fireInputChanged();
  }

  get booleanSelectedIndex() {
    const value = this.input.value.toUpperCase();
    return value === 'TRUE'
      ? '0'
      : value === 'FALSE'
        ? '1'
        : '-1';
  }

  handleBooleanInput(e) {
    this.input = e.detail.value;
    this.fireInputChanged();
  }

  fireInputChanged() {
    const event = new CustomEvent('input__changed', {
      detail: {
        input: this.input
      }
    });
    this.dispatchEvent(event);
  }
}
