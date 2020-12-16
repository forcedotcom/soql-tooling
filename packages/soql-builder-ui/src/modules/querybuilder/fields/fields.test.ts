/*
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 */

import { createElement } from 'lwc';
import Fields from 'querybuilder/fields';

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

    const fieldOption = fields.shadowRoot.querySelector("option[value='foo']");
    fieldOption.click();

    expect(handler).toHaveBeenCalled();
  });

  it('emits event when a field is removed', () => {
    fields.selectedFields = ['foo', 'bar'];
    document.body.appendChild(fields);

    const handler = jest.fn();
    fields.addEventListener('fields__removed', handler);

    const selectedFieldCloseEl = fields.shadowRoot.querySelector(
      "[data-field='foo']"
    );
    selectedFieldCloseEl.click();

    expect(handler).toHaveBeenCalled();
  });

  it('renders the selected fields in the component', () => {
    document.body.appendChild(fields);

    let selectedFieldEl = fields.shadowRoot.querySelectorAll('.selected-field');
    expect(selectedFieldEl.length).toBe(0);

    const fieldOptions = fields.fields;
    fields.selectedFields = fieldOptions;

    return Promise.resolve().then(() => {
      selectedFieldEl = fields.shadowRoot.querySelectorAll('.selected-field');
      expect(selectedFieldEl.length).toBe(3);
    });
  });

  it('should alert user when loading', async () => {
    fields.selectedFields = [];
    fields.fields = [];
    document.body.appendChild(fields);
    expect(fields.isLoading).toEqual(false);
    let defaultOption = fields.shadowRoot.querySelector(
      '[data-el-default-option]'
    );
    expect(defaultOption.innerHTML).toContain('Select');
    fields.isLoading = true;
    return Promise.resolve().then(() => {
      defaultOption = fields.shadowRoot.querySelector(
        '[data-el-default-option]'
      );
      expect(defaultOption.innerHTML.toLowerCase()).toContain('loading');
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
});
