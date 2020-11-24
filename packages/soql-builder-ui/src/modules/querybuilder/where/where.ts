/*
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 */

import { api, LightningElement } from 'lwc';
import { JsonMap } from '@salesforce/ts-types';

interface ConditionTemplate {
  field: undefined;
  operator: undefined;
  criteria: { value: null };
  index: number;
}

export default class Where extends LightningElement {
  @api whereFields: string[]; // all fields of an sObject
  @api whereExpr: JsonMap; // this is the {} that represents SOQL Text
  _andOr;
  templateIndex: number;
  conditionTemplate: ConditionTemplate = {
    field: undefined,
    operator: undefined,
    criteria: { value: null },
    index: 0 // this needs to be based on this.whereExpr.conditons.length
  };

  get _conditionsRendered(): object[] {
    if (this.whereExpr.conditions && this.whereExpr.conditions.length) {
      console.log('from _renderedConditions--> whereExprs: ', this.whereExpr);
      return this.whereExpr.conditions;
    }
    return [this.conditionTemplate];
  }

  renderedCallback() {
    console.log('WHERE CMP rerendered with ', this._conditionsRendered);
    // console.log('WEHRE CMP, where exprs: ', this.whereExpr);
  }

  handleModGroupSelection(e) {
    const whereSelectionEvent = new CustomEvent('whereselection', {
      detail: e.detail
    });
    this.dispatchEvent(whereSelectionEvent);
  }

  handleAddModGroup(e) {
    e.preventDefault();
  }
}
