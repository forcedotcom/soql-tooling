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
  let header;
  const ERROR_MESSAGES = ['ozzy', 'ronnie james dio'];
  const RUN_BUTTON_SELECTOR = '[data-el-run-button]';
  const HEADER_CONTENT_SELECTOR = '.header__content';
  const ERROR_MESSAGES_SELECTOR = HEADER_CONTENT_SELECTOR + ' ul li';
  const EVENT_NAME = 'header__run_query';
  const DISABLED_BUTTON_CLASS = 'btn--disabled'; // no dot, not the selector

  beforeEach(() => {
    header = createElement('querybuilder-header', {
      is: Header
    });
  });

  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it('emits a run event', () => {
    document.body.appendChild(header);

    const handler = jest.fn();
    header.addEventListener(EVENT_NAME, handler);

    const runQueryBtn = header.shadowRoot.querySelector(RUN_BUTTON_SELECTOR);
    runQueryBtn.click();

    return Promise.resolve().then(() => {
      expect(handler).toHaveBeenCalled();
    });
  });

  it('adds appropriate notification warning style', () => {
    header.errorMessages = ERROR_MESSAGES;
    document.body.appendChild(header);
    const warning = header.shadowRoot.querySelectorAll('.warning-notification');
    expect(warning.length).toBeTruthy();
  });

  it('does not emit run event if running', () => {
    header.isRunning = true;
    document.body.appendChild(header);

    const handler = jest.fn();
    header.addEventListener(EVENT_NAME, handler);

    const runQueryBtn = header.shadowRoot.querySelector(RUN_BUTTON_SELECTOR);
    runQueryBtn.click();

    return Promise.resolve().then(() => {
      expect(handler).not.toHaveBeenCalled();
    });
  });

  it('shows notification if errors', () => {
    header.errorMessages = ERROR_MESSAGES;
    document.body.appendChild(header);
    const headerContent = header.shadowRoot.querySelectorAll(
      HEADER_CONTENT_SELECTOR
    );
    expect(headerContent.length).toBeTruthy();
  });
});
