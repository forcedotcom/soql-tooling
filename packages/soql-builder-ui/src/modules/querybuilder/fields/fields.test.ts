/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/*
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 */

import { createElement } from 'lwc';
import Fields from 'querybuilder/fields';
import { SELECT_COUNT } from '../services/model';

describe('Fields', () => {
  const fields = createElement('querybuilder-fields', {
    is: Fields
  });

  beforeEach(() => {
    fields.fields = ['foo', 'bar', 'baz'];
    fields.selectedFields = [];
  });

  afterEach(() => {
    jest.clearAllMocks();
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it('emits event when field is selected', () => {
    document.body.appendChild(fields);

    const handler = jest.fn();
    fields.addEventListener('fields__selected', handler);

    const customSelect = fields.shadowRoot.querySelector(
      'querybuilder-custom-select'
    );
    customSelect.dispatchEvent(
      new CustomEvent('option__selection', { detail: { value: 'foo' } })
    );

    expect(handler).toHaveBeenCalled();
  });

  it('emits event when a field is removed', () => {
    fields.selectedFields = ['foo', 'bar'];
    document.body.appendChild(fields);

    const handler = jest.fn();
    fields.addEventListener('fields__selected', handler);
    const selectedFieldCloseEl = fields.shadowRoot.querySelector(
      "[data-field='foo']"
    );
    selectedFieldCloseEl.click();

    expect(handler).toHaveBeenCalled();
  });

  it('renders COUNT() and the selected fields in the component', () => {
    document.body.appendChild(fields);

    let selectedFieldEl = fields.shadowRoot.querySelectorAll('.selected-field');
    expect(selectedFieldEl.length).toBe(0);

    const fieldOptions = fields.fields;
    fields.selectedFields = fieldOptions;

    return Promise.resolve().then(() => {
      selectedFieldEl = fields.shadowRoot.querySelectorAll('.selected-field');
      expect(selectedFieldEl.length).toBe(4);
    });
  });

  it('should alert user when error', async () => {
    document.body.appendChild(fields);
    expect(fields.hasError).toEqual(false);

    let hasError = fields.shadowRoot.querySelectorAll('[data-el-has-error]');

    expect(hasError.length).toEqual(0);
    fields.hasError = true;

    return Promise.resolve().then(() => {
      hasError = fields.shadowRoot.querySelectorAll('[data-el-has-error]');
      expect(hasError.length).toEqual(1);
    });
  });

  it('removes other selections when COUNT() is selected', async () => {
    fields.selectedFields = ['foo', 'bar'];
    document.body.appendChild(fields);

    let selectionFromEvent;
    const selectHandler = jest.fn().mockImplementation((e) => {
      selectionFromEvent = e.detail.fields;
    });
    fields.addEventListener('fields__selected', selectHandler);

    const customSelect = fields.shadowRoot.querySelector(
      'querybuilder-custom-select'
    );
    customSelect.dispatchEvent(
      new CustomEvent('option__selection', { detail: { value: SELECT_COUNT } })
    );

    expect(selectHandler).toHaveBeenCalledTimes(1);
    expect(selectionFromEvent).toEqual([SELECT_COUNT]);
  });

  it('removes COUNT() when something else is selected', async () => {
    fields.selectedFields = [SELECT_COUNT];
    document.body.appendChild(fields);

    let selectionFromEvent;
    const selectHandler = jest.fn().mockImplementation((e) => {
      selectionFromEvent = e.detail.fields;
    });
    fields.addEventListener('fields__selected', selectHandler);

    const customSelect = fields.shadowRoot.querySelector(
      'querybuilder-custom-select'
    );
    customSelect.dispatchEvent(
      new CustomEvent('option__selection', { detail: { value: 'foo' } })
    );

    expect(selectHandler).toHaveBeenCalledTimes(1);
    expect(selectionFromEvent).toEqual(['foo']);
  });
});
