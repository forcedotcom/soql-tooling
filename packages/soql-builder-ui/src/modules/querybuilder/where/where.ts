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
  @api whereFields: string[]; // all fields of an sObject
  @api whereExpr: JsonMap; // this is the {conditions: [], andOR: 'AND'} that represents SOQL Text
  _andOr;
  //@track produces infinate loop
  _renderedConditionsStore: JsonMap[] = [];
  conditionTemplate: ConditionTemplate = {
    field: undefined,
    operator: undefined,
    criteria: { value: null },
    index: this.templateIndex // this needs to be based on this.whereExpr.conditons.length
  };

  /* Can't push to this if getter */
  get _conditionsRendered(): JsonMap[] {
    console.log('get condis rendered called');
    if (
      this.whereExpr &&
      this.whereExpr.conditions &&
      this.whereExpr.conditions.length
    ) {
      console.log(
        'from get _renderedConditions--> whereExprs: ',
        this.whereExpr
      );
      return this.whereExpr.conditions;
    }
    return [this.conditionTemplate];
  }
  /* This is only called once, need to be re-evaluated each time */
  get templateIndex(): number {
    console.log('store = ', this._renderedConditionsStore);
    if (this._renderedConditionsStore) {
      const numberOfConditions = this._renderedConditionsStore.length;
      return numberOfConditions <= 1 ? 0 : numberOfConditions;
    }
    return 0;
  }

  connectedCallback() {
    this._renderedConditionsStore = [];
  }

  renderedCallback() {
    console.log('=== CMP rerendered with ', this._conditionsRendered);
    // if (this.whereExpr && this.whereExpr.conditions.length) {
    //   console.log(
    //     'from get _renderedConditions--> whereExprs: ',
    //     this.whereExpr
    //   );
    //   return this.whereExpr.conditions;
    // }
    // return [this.conditionTemplate];
    console.log('** UI Model to cmp: ', this.whereExpr);
  }

  handleModGroupSelection(e) {
    const whereSelectionEvent = new CustomEvent('whereselection', {
      detail: e.detail
    });
    this.dispatchEvent(whereSelectionEvent);
  }

  handleAddModGroup(e) {
    e.preventDefault();
    this._renderedConditionsStore.push(this.conditionTemplate);
    console.log(
      'add modifier, _renderedConditionsStore => ',
      this._renderedConditionsStore
    );
  }
}
