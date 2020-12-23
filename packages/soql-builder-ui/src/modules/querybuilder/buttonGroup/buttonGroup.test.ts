/*
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 */

import { createElement, LightningElement } from 'lwc';
import ButtonGroup from 'querybuilder/buttonGroup';

describe('ButtonGroup should', () => {
  let buttonGroup: LightningElement;
  let buttonValues = [
    { label: 'foo', value: { foo: 'FOO' } },
    { label: 'bar', value: { bar: 'BAR' } }
  ];

  beforeEach(() => {
    buttonGroup = createElement('querybuilder-button-group', {
      is: ButtonGroup
    });
    buttonGroup.buttonValues = buttonValues;
  });

  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it('render a button with each button label', () => {
    document.body.appendChild(buttonGroup);

    const buttonElements = buttonGroup.shadowRoot.querySelectorAll('button');
    expect(buttonElements.length).toEqual(buttonValues.length);
    buttonElements.forEach(element => {
      const idx = parseInt(element.attributes.index.value);
      const name = element.attributes.name.value;
      const value = element.attributes.value.value;
      expect(name).toEqual(buttonValues[idx].label);
      expect(value).toEqual(JSON.stringify(buttonValues[idx].value));
    });
  });

  it('return selection index -1 when selectedIndex not specified', () => {
    document.body.appendChild(buttonGroup);

    expect(buttonGroup.selectedIndex).toEqual('-1');
  });

  it('select button with selectedIndex when specified', () => {
    buttonGroup.selectedIndex = '1';
    document.body.appendChild(buttonGroup);

    expect(buttonGroup.selectedIndex).toEqual('1');
  });

  it('fire selection changed event when button clicked', () => {
    buttonGroup.selectedIndex = '1';
    const handler = jest.fn();
    buttonGroup.addEventListener('selection__changed', handler);
    document.body.appendChild(buttonGroup);

    let button0 = buttonGroup.shadowRoot.querySelectorAll('button')[0];
    expect(button0).toBeTruthy();
    button0.click();

    expect(buttonGroup.selectedIndex).toEqual('0');
    expect(handler).toHaveBeenCalled();
  });
});
