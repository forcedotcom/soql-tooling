/*
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 */
import { api, LightningElement } from 'lwc';
import { debounce } from 'debounce';
import { JsonMap } from '@salesforce/types';

export default class WhereModifierGroup extends LightningElement {
  @api allFields: string[];
  @api selectedField: string = undefined;
  @api selectedOperator: string;
  @api criteria: JsonMap = {};
  @api isLoading = false;
  @api index;
  _allModifiersHaveValue: boolean = false;
  operatorOptions = [
    {
      value: 'EQ',
      displayValue: '='
    },
    {
      value: 'NOT_EQ',
      displayValue: '≠'
    },
    {
      value: 'LT',
      displayValue: '<'
    },
    {
      value: 'LT_EQ',
      displayValue: '≤'
    },
    {
      value: 'GT',
      displayValue: '>'
    },
    {
      value: 'GT_EQ',
      displayValue: '≥'
    },
    {
      value: 'LIKE',
      displayValue: 'like'
    }
    /*
    use these operators once work to handle
    incomming %, _, concat with plain user text
    is implimented.
    */
    /* {
      value: 'LIKE_START',
      displayValue: 'starts with'
    },
    {
      value: 'LIKE_END',
      displayValue: 'ends with'
    },
    {
      value: 'LIKE_CONTAINS',
      displayValue: 'contains'
    } */
  ];
  handleSelectionEvent: () => void;
  // this need to be public so parent can read value
  @api get allModifiersHaveValue() {
    return this._allModifiersHaveValue;
  }

  constructor() {
    super();
    this.handleSelectionEvent = debounce(
      selectionEventHandler.bind(this),
      1000
    );
  }

  renderedCallback() {
    this.checkAllModifiersHaveValues();
  }

  checkAllModifiersHaveValues(): Boolean {
    const fieldEl = this.template.querySelector('[data-el-where-field]');
    const operatorEl = this.template.querySelector('[data-el-where-operator]');
    const criteriaEl = this.template.querySelector('[data-el-where-criteria]');
    const allHaveValues = Boolean(
      fieldEl.value && operatorEl.value && criteriaEl.value
    );
    this._allModifiersHaveValue = allHaveValues;

    return allHaveValues;
  }

  /* --- FIELDS --- */
  get hasSelectedField() {
    return !!this.selectedField;
  }

  get filteredFields() {
    return this.allFields.filter((field) => {
      return field !== this.selectedField;
    });
  }

  get defaultFieldOptionText() {
    // TODO: i18n
    return this.isLoading ? 'Loading...' : 'Select Field...';
  }
  /* --- OPERATORS --- */
  get hasSelectedOperator() {
    return !!this.selectedOperator;
  }

  get _selectedOperator() {
    return this.operatorOptions.find(
      (option) => option.value === this.selectedOperator
    );
  }

  get filteredOperators() {
    return this.operatorOptions.filter((option) => {
      return option.value !== this.selectedOperator;
    });
  }

  /*TODO:
  - refactor the names of the remove events so they are not redundant.
  - try to get events to bubble up to the parent and remove pass through events.
  */

  handleConditionRemoved(e) {
    e.preventDefault();
    console.log('Remove condition', this.index);
    const conditionRemovedEvent = new CustomEvent('conditionremoved', {
      detail: {
        index: this.index
      }
    });

    this.dispatchEvent(conditionRemovedEvent);
  }
}

/* --- CRITERIA --- */
// only send an event if all fields have value
// TODO: handle when critera is cleared, no value, but need to send event.
function selectionEventHandler(e) {
  e.preventDefault();
  const fieldEl = this.template.querySelector('[data-el-where-field]');
  const operatorEl = this.template.querySelector('[data-el-where-operator]');
  const criteriaEl = this.template.querySelector('[data-el-where-criteria]');

  if (this.checkAllModifiersHaveValues()) {
    const modGroupSelectionEvent = new CustomEvent('modifiergroupselection', {
      detail: {
        field: fieldEl.value,
        operator: operatorEl.value,
        criteria: { type: this.criteria.type, value: criteriaEl.value }, // type needs to be dynamic
        index: this.index
      }
    });
    this.dispatchEvent(modGroupSelectionEvent);
  }
}
