/*
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 */
import { api, LightningElement, track } from 'lwc';
import { debounce } from 'debounce';
import { Soql } from '@salesforce/soql-model';
import { JsonMap } from '@salesforce/types';
import { operatorOptions } from '../services/model';
import { SObjectType, SObjectTypeUtils } from '../services/sobjectUtils';
import { displayValueToSoqlStringLiteral, soqlStringLiteralToDisplayValue } from '../services/soqlUtils';


export default class WhereModifierGroup extends LightningElement {
  @api allFields: string[];
  @api selectedField: string = undefined;
  @api selectedOperator: string;
  @api isLoading = false;
  @api index;
  @api sobjectTypeUtils: SObjectTypeUtils;
  _criteria: JsonMap = {};
  _allModifiersHaveValue: boolean = false;
  fieldEl: HTMLSelectElement;
  operatorEl: HTMLSelectElement;
  criteriaEl: HTMLInputElement;
  @track
  errorMessage = '';

  handleSelectionEvent: () => void;
  // this need to be public so parent can read value
  @api get allModifiersHaveValue() {
    return this._allModifiersHaveValue;
  }

  constructor() {
    super();
    this.handleSelectionEvent = debounce(selectionEventHandler.bind(this), 500);
  }

  renderedCallback() {
    this.fieldEl = this.template.querySelector('[data-el-where-field]');
    this.operatorEl = this.template.querySelector('[data-el-where-operator]');
    this.criteriaEl = this.template.querySelector('[data-el-where-criteria]');

    this.checkAllModifiersHaveValues();
  }

  checkAllModifiersHaveValues(): Boolean {
    const allHaveValues = Boolean(
      this.fieldEl.value && this.operatorEl.value && this.criteriaEl.value
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
    return operatorOptions.find(
      (option) => option.value === this.selectedOperator
    );
  }

  get filteredOperators() {
    return operatorOptions.filter((option) => {
      return option.value !== this.selectedOperator;
    });
  }
  /* --- CRITERIA --- */
  @api get criteria() {
    return this._criteria;
  }
  set criteria(criteria) {
    if (criteria && criteria.type && criteria.value) {
      const cleanedValue = this.displayValue(criteria.type, criteria.value);
      this._criteria = { ...criteria, value: cleanedValue };
    } else {
      this._criteria = criteria;
    }
  }

  handleConditionRemoved(e) {
    e.preventDefault();
    const conditionRemovedEvent = new CustomEvent('where__condition_removed', {
      detail: {
        index: this.index
      },
      bubbles: true,
      composed: true
    });

    this.dispatchEvent(conditionRemovedEvent);
  }

  displayValue(type: Soql.LiteralType, rawValue: string): string {
    let displayValue = rawValue;
    switch (type) {
      case Soql.LiteralType.String: {
        displayValue = soqlStringLiteralToDisplayValue(rawValue);
        break;
      }
    }
    return displayValue;
  }

  normalizeInput(type: SObjectType, value: string): string {
    let normalized = value;
    switch (type) {
      case SObjectType.Boolean:
      case SObjectType.Integer:
      case SObjectType.Long:
      case SObjectType.Double:
      case SObjectType.Date:
      case SObjectType.DateTime:
      case SObjectType.Time: {
        // do nothing
        break;
      }
      default: {
        // treat like string
        if (value.toLowerCase().trim() !== 'null') {
          normalized = displayValueToSoqlStringLiteral(value);
        }
        break;
      }
    }
    return normalized;
  }

  getSObjectType(fieldName: string): SObjectType {
    return this.sobjectTypeUtils ? this.sobjectTypeUtils.getType(fieldName) : SObjectType.AnyType;
  }

  getCriteriaType(type: SObjectType, value: string): Soql.LiteralType {
    let criteriaType = Soql.LiteralType.String;
    if (value.toLowerCase() === 'null') {
      return Soql.LiteralType.NULL;
    } else {
      switch (type) {
        case SObjectType.Boolean: {
          criteriaType = Soql.LiteralType.Boolean;
          break;
        }
        case SObjectType.Currency: {
          criteriaType = Soql.LiteralType.Currency;
          break;
        }
        case SObjectType.DateTime:
        case SObjectType.Date:
        case SObjectType.Time: {
          criteriaType = Soql.LiteralType.Date;
          break;
        }
        case SObjectType.Integer:
        case SObjectType.Long:
        case SObjectType.Percent:
        case SObjectType.Double: {
          criteriaType = Soql.LiteralType.Number;
          break;
        }
      }
    }
    return criteriaType;
  }

  validateInput(): boolean {
    if (this.checkAllModifiersHaveValues()) {

      const fieldName = this.selectedField = this.fieldEl.value;
      const op = this.selectedOperator = this.operatorEl.value;

      const type = this.getSObjectType(fieldName);
      const normalizedInput = this.normalizeInput(type, this.criteriaEl.value);
      const critType = this.getCriteriaType(type, normalizedInput);

      const crit = this.criteria = {
        type: critType,
        value: normalizedInput
      };
      this.errorMessage = '';

      switch (type) {
        case SObjectType.Boolean: {
          if (!(crit.value.toLowerCase() === 'true' || crit.value.toLowerCase() === 'false')) {
            this.errorMessage = 'Value must be TRUE or FALSE';
            return false;
          } else if (!(op === 'EQ' || op === 'NOT_EQ')) {
            this.errorMessage = 'Operator must be = or ≠';
            return false;
          }
          break;
        }
        case SObjectType.Integer:
        case SObjectType.Long: {
          const intPattern = /^[+-]?[0-9]+$/;
          if (!intPattern.test(crit.value.trim())) {
            this.errorMessage = 'Value must be a whole number';
            return false;
          }
          break;
        }
        case SObjectType.Double: {
          const floatPattern = /^[+-]?[0-9]*[.]?[0-9]+$/;
          if (!floatPattern.test(crit.value.trim())) {
            this.errorMessage = 'Value must be numeric';
            return false;
          }
          break;
        }
      }
    }

    return true;
  }
}

function selectionEventHandler(e) {
  e.preventDefault();

  if (this.checkAllModifiersHaveValues() && this.validateInput()) {
    const modGroupSelectionEvent = new CustomEvent('modifiergroupselection', {
      detail: {
        field: this.fieldEl.value,
        operator: this.operatorEl.value,
        criteria: {
          type: this.criteria.type,
          value: this.normalizeInput(this.getSObjectType(this.fieldEl.value), this.criteriaEl.value)
        }, // type needs to be dynamic based on field selection
        index: this.index
      }
    });
    this.dispatchEvent(modGroupSelectionEvent);
  }
}
