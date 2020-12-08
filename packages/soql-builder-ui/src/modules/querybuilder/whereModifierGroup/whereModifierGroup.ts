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
  @api isLoading = false;
  @api index;
  _criteria: JsonMap = {};
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
      2000
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
  /* --- CRITERIA --- */
  @api get criteria() {
    return this._criteria;
  }
  set criteria(criteria) {
    if (criteria && criteria.value) {
      const cleanedValue = criteria.value.replace(/['"]+/g, '');
      this._criteria = { ...criteria, value: cleanedValue };
    } else {
      this._criteria = criteria;
    }
  }

  handleConditionRemoved(e) {
    e.preventDefault();
    const conditionRemovedEvent = new CustomEvent('where__conditionremoved', {
      detail: {
        index: this.index
      },
      bubbles: true,
      composed: true
    });

    this.dispatchEvent(conditionRemovedEvent);
  }

  /*
  This should be temporary until we have more specific validation.
  For now, this will wrap the user input in quotes unless
  the value is:
  - a number
  - a boolean value
  */
  normalizeInput(value: string): string {
    // prevent values from being wrapped in quotes twice
    value = value.replace(/['"]+/g, '');
    if (
      !isNaN(+value) ||
      value.toLocaleLowerCase() === 'true' ||
      value.toLocaleLowerCase() === 'false'
    ) {
      return value;
    }
    return `'${value}'`;
  }
}

// only send an event if all fields have value
function selectionEventHandler(e) {
  e.preventDefault();
  const fieldEl = this.template.querySelector('[data-el-where-field]');
  const operatorEl = this.template.querySelector('[data-el-where-operator]');
  const criteriaEl = this.template.querySelector('[data-el-where-criteria]');

  if (this.checkAllModifiersHaveValues()) {
    const modGroupSelectionEvent = new CustomEvent(
      'where__modifiergroupselection',
      {
        detail: {
          field: fieldEl.value,
          operator: operatorEl.value,
          criteria: {
            type: this.criteria.type,
            value: this.normalizeInput(criteriaEl.value)
          }, // type needs to be dynamic based on field selection
          index: this.index
        },
        bubbles: true,
        composed: true
      }
    );
    this.dispatchEvent(modGroupSelectionEvent);
  }
}
