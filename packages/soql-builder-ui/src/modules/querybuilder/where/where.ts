/*
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 */

import { api, LightningElement, track } from 'lwc';
import { JsonMap } from '@salesforce/ts-types';

interface ConditionTemplate {
  field: undefined;
  operator: undefined;
  criteria: { value: null };
  index: number;
}

export default class Where extends LightningElement {
  @api
  whereFields: string[];
  _andOr;
  conditionTemplate: ConditionTemplate = {
    field: undefined,
    operator: undefined,
    criteria: { value: null },
    index: this.templateIndex
  };

  @track
  _conditionsStore: JsonMap[] = [];

  @api
  get whereExpr(): JsonMap {
    return { conditions: this._conditionsStore, andOr: this._andOr };
  }

  set whereExpr(where: JsonMap) {
    console.log('** UI Model to cmp: ', where);
    if (where.conditions && where.conditions.length) {
      this._conditionsStore = where.conditions;
    } else {
      this._conditionsStore = [this.conditionTemplate];
    }
    this._andOr = where.andOr;
  }

  get templateIndex(): number {
    if (this._conditionsStore) {
      const numberOfConditions = this._conditionsStore.length;
      return numberOfConditions;
    }
    return 0;
  }

  renderedCallback() {
    console.log('=== CMP rerendered with ', this._conditionsStore);

    console.log('** UI Model to cmp: ', this.whereExpr.conditions);
  }

  handleModGroupSelection(e) {
    const whereSelectionEvent = new CustomEvent('whereselection', {
      detail: e.detail
    });
    this.dispatchEvent(whereSelectionEvent);
  }

  handleAddModGroup(e) {
    e.preventDefault();
    const newTemplate = {
      ...this.conditionTemplate,
      index: this.templateIndex
    };
    this._conditionsStore = [...this._conditionsStore, newTemplate];
    console.log('add modifier, _conditionsStore => ', this._conditionsStore);
  }
}
