/*
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 */

export function getWindow() {
  return window;
}

export function getBodyClass() {
  return window.document.body.getAttribute('class');
}

export function getLocalStorage() {
  return localStorage;
}

export function hasVscode() {
  // @ts-ignore
  // eslint-disable-next-line no-undef
  return 'undefined' !== typeof acquireVsCodeApi;
}

let vsCode = undefined;

export function getVscode() {
  if (hasVscode()) {
    if (!vsCode) {
      // @ts-ignore
      // eslint-disable-next-line no-undef
      vsCode = acquireVsCodeApi();
    }

    return vsCode;
  }
  return false;
}
