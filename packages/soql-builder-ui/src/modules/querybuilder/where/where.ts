/*
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 */

import { api, LightningElement, track } from 'lwc';
import { JsonMap } from '@salesforce/ts-types';
import { AndOr } from '../services/model';

interface ConditionTemplate {
  field: undefined;
  operator: undefined;
  criteria: { type: null; value: null };
  index: number;
}

interface ModifierGroupNode extends Node {
  allModifiersHaveValue: boolean;
}

export default class Where extends LightningElement {
  @api isLoading = false;
  @api whereFields: string[];
  @track _conditionsStore: JsonMap[] = [];
  _andOr = AndOr.AND;
  conditionTemplate: ConditionTemplate = {
    field: undefined,
    operator: undefined,
    criteria: { type: null, value: null },
    index: this.templateIndex
  };
  lastModifierGroupIsComplete = false;

  @api get whereExpr(): JsonMap {
    return { conditions: this._conditionsStore, andOr: this._andOr };
  }

  set whereExpr(where: JsonMap) {
    if (where.conditions && where.conditions.length) {
      this._conditionsStore = where.conditions;
    } else {
      this._conditionsStore = [this.conditionTemplate];
    }

    if (where.andOr) {
      this._andOr = where.andOr;
    }
  }

  get templateIndex(): number {
    return this._conditionsStore.length;
  }

  headerSelectedClass = ' header__btn--selected';
  get andBtnClassList() {
    let andClassList = 'header__btn header__btn--and';
    andClassList += this._andOr === AndOr.AND ? this.headerSelectedClass : '';

    return andClassList;
  }

  get orBtnClassList() {
    let orClassList = 'header__btn header__btn--or';
    orClassList += this._andOr === AndOr.OR ? this.headerSelectedClass : '';

    return orClassList;
  }

  get addBtnClassList() {
    const disabledBtnClass = 'btn--disabled';
    let classList = '';
    classList += !this.lastModifierGroupIsComplete ? disabledBtnClass : '';
    return classList;
  }

  renderedCallback() {
    this.checkLastModifierGroup();
  }

  getModfierGroupsRendered(): NodeList {
    return this.template.querySelectorAll('querybuilder-where-modifier-group');
  }

  checkLastModifierGroup() {
    const modfierGroupsRendered = this.getModfierGroupsRendered();

    if (this.getModfierGroupsRendered().length) {
      const lastGroupIndex = modfierGroupsRendered.length - 1;
      const lastGroupIsComplete = (modfierGroupsRendered[
        lastGroupIndex
      ] as ModifierGroupNode).allModifiersHaveValue;

      this.lastModifierGroupIsComplete = lastGroupIsComplete;
    }
  }

  handleAddModGroup(e) {
    e.preventDefault();
    const newTemplate = {
      ...this.conditionTemplate,
      index: this.templateIndex
    };
    this._conditionsStore = [...this._conditionsStore, newTemplate];
  }

  handleSetAndOr(e) {
    e.preventDefault();
    const selectedValue = e.target.value;
    const isValidValue =
      selectedValue === AndOr.AND || selectedValue === AndOr.OR;

    if (isValidValue && selectedValue !== this._andOr) {
      this._andOr = selectedValue;

      if (
        this.getModfierGroupsRendered().length > 1 &&
        this.lastModifierGroupIsComplete
      ) {
        const andOrSelectionEvent = new CustomEvent('andorselection', {
          detail: selectedValue
        });
        this.dispatchEvent(andOrSelectionEvent);
      }
    }
  }

  handleModifierGroupSelection(e) {
    e.preventDefault();
    const modifierSelectionWithAndOrEvent = new CustomEvent(
      'modifierselectionwithandor',
      {
        detail: { fieldCompareExpr: e.detail, andOr: this._andOr }
      }
    );
    this.dispatchEvent(modifierSelectionWithAndOrEvent);
  }
}
