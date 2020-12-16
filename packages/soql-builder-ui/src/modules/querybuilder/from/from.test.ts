/*
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 */

import { createElement } from 'lwc';
import From from 'querybuilder/from';

describe('From', () => {
  let from;

  beforeEach(() => {
    from = createElement('querybuilder-from', {
      is: From
    });
    from.selected = 'Account';
    from.sobjects = ['foo', 'bar', 'baz'];
  });

  afterEach(() => {
    jest.clearAllMocks();
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it('displays sObject from tooling model as selected', () => {
    document.body.appendChild(from);

    const selectedSobject = from.selected;
    const allOptions = from.shadowRoot.querySelectorAll('option');
    expect(allOptions.length).toBe(4);

    // check if the correct element is 'selected'
    const firstOptionEl = from.shadowRoot.querySelector('option');
    expect(firstOptionEl.textContent).toBe(selectedSobject);
    expect(firstOptionEl.selected).toBeTruthy();
  });

  it('does not display the selected element twice', () => {
    document.body.appendChild(from);

    const allOptions = Array.from(from.shadowRoot.querySelectorAll('option'));
    const optionValues = allOptions.map(
      (option: HTMLOptionElement) => option.value
    );
    const areOptionsUnique = (options) =>
      Array.isArray(options) && new Set(options).size === options.length;

    expect(areOptionsUnique(optionValues)).toBeTruthy();
  });

  it('emits an event when object is selected', () => {
    document.body.appendChild(from);

    const handler = jest.fn();
    from.addEventListener('from__object_selected', handler);
    const selectEl = from.shadowRoot.querySelector('select');
    selectEl.dispatchEvent(new Event('change'));

    return Promise.resolve().then(() => {
      expect(handler).toHaveBeenCalled();
    });
  });

  it('should alert user when loading', async () => {
    from.selected = undefined;
    from.sobjects = [];
    document.body.appendChild(from);
    expect(from.isLoading).toEqual(false);
    let defaultOption = from.shadowRoot.querySelector(
      '[data-el-default-option]'
    );
    expect(defaultOption.innerHTML).toContain('Select');
    from.isLoading = true;
    return Promise.resolve().then(() => {
      defaultOption = from.shadowRoot.querySelector('[data-el-default-option]');
      expect(defaultOption.innerHTML.toLowerCase()).toContain('loading');
    });
  });

  it('should alert user when error', async () => {
    document.body.appendChild(from);
    expect(from.hasError).toEqual(false);
    let hasError = from.shadowRoot.querySelectorAll('[data-el-has-error]');
    expect(hasError.length).toEqual(0);
    from.hasError = true;
    return Promise.resolve().then(() => {
      hasError = from.shadowRoot.querySelectorAll('[data-el-has-error]');
      expect(hasError.length).toEqual(1);
    });
  });
});
