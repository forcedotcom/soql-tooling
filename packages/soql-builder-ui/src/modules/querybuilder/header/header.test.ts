/*
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 */

// @ts-ignore
import { createElement } from 'lwc';
import Header from 'querybuilder/header';

describe('Header', () => {
  const header = createElement('querybuilder-header', {
    is: Header
  });

  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it('emits a save event', () => {
    document.body.appendChild(header);

    const handler = jest.fn();
    header.addEventListener('save', handler);

    const saveBtn = header.shadowRoot.querySelector('.run-button');
    saveBtn.click();

    return Promise.resolve().then(() => {
      expect(handler).toHaveBeenCalled();
    });
  });
});
