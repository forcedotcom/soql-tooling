/*
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 */

import { LightningElement, api } from 'lwc';

export default class From extends LightningElement {
  @api sobjects: string[];
  @api hasError = false;
  @api isLoading = false;
  selectPlaceHolderText = 'Search object...'; //i18n
  _selectedObject: string[] = [];

  @api
  get selected() {
    return this._selectedObject[0];
  }

  set selected(objectName: string) {
    this._selectedObject = objectName ? [objectName] : [];
  }

  handleSobjectSelection(e) {
    e.preventDefault();
    const selectedSobject = e.detail.value;
    if (selectedSobject && selectedSobject.length) {
      const sObjectSelected = new CustomEvent('from__object_selected', {
        detail: { selectedSobject }
      });
      this.dispatchEvent(sObjectSelected);
    }
  }
}
