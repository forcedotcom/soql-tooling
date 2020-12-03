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
    }
  ];
  handleSelectionEvent: () => void;

  constructor() {
    super();
    this.handleSelectionEvent = debounce(selectionEventHandler.bind(this), 500);
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
}
/* --- CRITERIA --- */
// only send an event if all fields have value
// TODO: handle when critera is cleared, no value, but need to send event.
function selectionEventHandler(e) {
  e.preventDefault();
  const fieldEl = this.template.querySelector('[data-el-where-field]');
  const operatorEl = this.template.querySelector('[data-el-where-operator]');
  const criteriaEl = this.template.querySelector('[data-el-where-criteria]');

  if (fieldEl.value && operatorEl.value && criteriaEl.value) {
    const modGroupSelectionEvent = new CustomEvent('modifiergroupselection', {
      detail: {
        field: fieldEl.value,
        operator: operatorEl.value,
        criteria: { type: this.criteria.type, value: criteriaEl.value }, // type need to by dynamic
        index: this.index
      }
    });
    this.dispatchEvent(modGroupSelectionEvent);
  }
}
