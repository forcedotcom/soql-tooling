/*
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 */

import { createElement } from 'lwc';
import App from 'querybuilder/app';

describe('App should', () => {
  let app;

  beforeEach(() => {
    app = createElement('querybuilder-app', {
      is: App
    });
    document.body.appendChild(app);
  });

  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it('display the app', () => {
    const from = app.shadowRoot.querySelectorAll('querybuilder-from');
    expect(from.length).toEqual(1);

    const fields = app.shadowRoot.querySelectorAll('querybuilder-fields');
    expect(fields.length).toEqual(1);

    const preview = app.shadowRoot.querySelectorAll(
      'querybuilder-query-preview'
    );
    expect(preview.length).toEqual(1);
  });
});
