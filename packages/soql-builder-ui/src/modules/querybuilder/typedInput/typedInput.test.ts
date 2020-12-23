/*
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 */

import { createElement, LightningElement } from 'lwc';
import TypedInput from 'querybuilder/typedInput';
import { continueStatement } from '../../../../../../../../Library/Caches/typescript/4.0/node_modules/@babel/types/lib/index';

describe('TypedInput should', () => {
  let typedInput: LightningElement;
  let stringInput = { type: 'STRING', value: "'foo'" };
  let nullInput = { type: 'NULL', value: 'NULL' };
  let booleanInput = { type: 'BOOLEAN', value: 'TRUE' };

  beforeEach(() => {
    typedInput = createElement('querybuilder-typed-input', {
      is: TypedInput
    });
  });

  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it('render boolean input for boolean input', () => {
    typedInput.input = booleanInput;

    document.body.appendChild(typedInput);

    const buttonGroup = typedInput.shadowRoot.querySelector('querybuilder-button-group');
    expect(buttonGroup).toBeTruthy();
  });

  it('render default input for string input', () => {
    typedInput.input = stringInput;

    document.body.appendChild(typedInput);

    const input = typedInput.shadowRoot.querySelector('input');
    expect(input).toBeTruthy();
  });

  it('render default input for null input', () => {
    typedInput.input = nullInput;

    document.body.appendChild(typedInput);

    const input = typedInput.shadowRoot.querySelector('input');
    expect(input).toBeTruthy();
  });

  it('normalizes "NULL" input to a null value', () => {
    typedInput.input = stringInput;

    document.body.appendChild(typedInput);

    const input = typedInput.shadowRoot.querySelector('input');
    input.value = 'null';
    const event = new Event('input', {
      bubbles: true,
      cancelable: true,
    });
    input.dispatchEvent(event);

    expect(typedInput.input).toEqual(nullInput);
  });

  it('normalizes display string input to a quoted, escaped SOQL value', () => {
    typedInput.input = stringInput;

    document.body.appendChild(typedInput);

    const input = typedInput.shadowRoot.querySelector('input');
    input.value = "quotes and \'escapes\'";
    const event = new Event('input', {
      bubbles: true,
      cancelable: true,
    });
    input.dispatchEvent(event);

    expect(typedInput.input).toEqual({ type: 'STRING', value: "'quotes and \\'escapes\\''" });
  });

  it('converts normalized string values to display values for display', () => {
    typedInput.input = { ...stringInput, value: "'quotes and \\'escapes\\''" };

    document.body.appendChild(typedInput);

    const input = typedInput.shadowRoot.querySelector('input');
    expect(input.value).toEqual("quotes and \'escapes\'");
  });
});
