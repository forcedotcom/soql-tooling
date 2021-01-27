/*
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 */
import { api, LightningElement, track } from 'lwc';
import { debounce } from 'debounce';
import { Soql, ValidatorFactory, splitMultiInputValues } from '@salesforce/soql-model';
import { JsonMap } from '@salesforce/types';
import { operatorOptions } from '../services/model';
import { SObjectTypeUtils } from '../services/sobjectUtils';
import {
  displayValueToSoqlStringLiteral,
  soqlStringLiteralToDisplayValue
} from '../services/soqlUtils';

export default class WhereModifierGroup extends LightningElement {
  @api allFields: string[];
  @api isLoading = false;
  @api index;
  @api get sobjectMetadata() {
    return this._sobjectMetadata;
  }
  set sobjectMetadata(sobjectMetadata: any) {
    this._sobjectMetadata = sobjectMetadata;
    this.sobjectTypeUtils = new SObjectTypeUtils(sobjectMetadata);
  }
  _condition: JsonMap;
  _currentOperatorValue;
  _criteriaDisplayValue;
  _sobjectMetadata: any;
  sobjectTypeUtils: SObjectTypeUtils;
  _allModifiersHaveValue: boolean = false;
  fieldEl: HTMLSelectElement;
  operatorEl: HTMLSelectElement;
  criteriaEl: HTMLInputElement;
  operatorErrorMessage = '';
  criteriaErrorMessage = '';
  hasOperatorError = false;
  hasCriteriaError = false;

  handleSelectionEvent: () => void;
  // this need to be public so parent can read value
  @api get allModifiersHaveValue() {
    return this._allModifiersHaveValue;
  }

  @api get condition(): JsonMap {
    return this._condition;
  }
  set condition(condition: JsonMap) {
    this._condition = condition;
    this._criteriaDisplayValue = '';
    if (this._selectedOperator && this.isMulipleValueOperator(this._selectedOperator.value)) {
      if (Array.isArray(condition.values)) {
        this._criteriaDisplayValue = condition.values.map(value => value.value).reduce((soFar, next) => {
          let accumulated = soFar;
          if (accumulated.length > 0) {
            accumulated += ', ';
          }
          accumulated += next;
          return accumulated;
        });
      }
    } else {
      if (condition.compareValue
        && condition.compareValue.type
        && condition.compareValue.value) {
        this._criteriaDisplayValue = this.displayValue(condition.compareValue.type, condition.compareValue.value);
      }
    }

    const matchingOption = condition ? operatorOptions.find(option => option.modelValue === condition.operator) : undefined;
    this._currentOperatorValue = matchingOption ? matchingOption.value : undefined;
  }

  constructor() {
    super();
    this.handleSelectionEvent = debounce(selectionEventHandler.bind(this), 500);
  }

  renderedCallback() {
    this.fieldEl = this.template.querySelector('[data-el-where-field]');
    this.operatorEl = this.template.querySelector(
      '[data-el-where-operator-input]'
    );
    this.criteriaEl = this.template.querySelector(
      '[data-el-where-criteria-input]'
    );
    this.checkAllModifiersHaveValues();
  }

  resetErrorFlagsAndMessages() {
    this.operatorErrorMessage = this.criteriaErrorMessage = '';
    this.hasOperatorError = this.hasCriteriaError = false;
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
    return !!this.getFieldName();
  }

  get _selectedField() {
    return this.getFieldName();
  }

  get filteredFields() {
    return this.allFields.filter((field) => {
      return field !== this.getFieldName();
    });
  }

  getFieldName(): string | undefined {
    return this.condition && this.condition.field && this.condition.field.fieldName ? this.condition.field.fieldName : undefined;
  }

  get defaultFieldOptionText() {
    // TODO: i18n
    return this.isLoading ? 'Loading...' : 'Select Field...';
  }
  /* --- OPERATORS --- */
  get hasSelectedOperator() {
    return !!this._currentOperatorValue;
  }

  get _selectedOperator() {
    return operatorOptions.find(
      (option) => option.value === this._currentOperatorValue
    );
  }

  toOperatorModelValue(value: string): string | undefined {
    const matchingOption = operatorOptions.find(option => option.value === value);
    return matchingOption ? matchingOption.modelValue : undefined;
  }

  get filteredOperators() {
    return operatorOptions.filter((option) => {
      return option.value !== this._currentOperatorValue
    });
  }

  /* --- CRITERIA --- */
  get criteriaDisplayValue(): string | undefined {
    return this._criteriaDisplayValue;
  }

  isMulipleValueOperator(operatorValue: string): boolean {
    return (operatorValue === 'IN'
      || operatorValue === 'NOT_IN'
      || operatorValue === 'INCLUDES'
      || operatorValue === 'EXCLUDES');
  }
  // @api get criteria() {
  //   return this._criteria;
  // }
  // set criteria(criteria) {
  //   if (criteria && criteria.type && criteria.value) {
  //     const cleanedValue = this.displayValue(criteria.type, criteria.value);
  //     this._criteria = { ...criteria, value: cleanedValue };
  //   } else {
  //     this._criteria = criteria;
  //   }
  // }

  /** css class methods */
  get operatorClasses() {
    let classes = 'modifier__item modifier__operator';
    classes = this.hasOperatorError
      ? classes + ' tooltip tooltip--error'
      : classes;
    return classes;
  }

  get criteriaClasses() {
    let classes = 'modifier__item modifier__criteria';
    classes = this.hasCriteriaError
      ? classes + ' tooltip tooltip--error'
      : classes;
    return classes;
  }
  /** end css class methods */

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

  normalizeInput(type: Soql.SObjectFieldType, value: string): string {
    let normalized = value;
    if (!this.isMulipleValueOperator(this._currentOperatorValue)) {
      switch (type) {
        case Soql.SObjectFieldType.Boolean:
        case Soql.SObjectFieldType.Integer:
        case Soql.SObjectFieldType.Long:
        case Soql.SObjectFieldType.Double:
        case Soql.SObjectFieldType.Date:
        case Soql.SObjectFieldType.DateTime:
        case Soql.SObjectFieldType.Time:
        case Soql.SObjectFieldType.Currency: {
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
    }
    return normalized;
  }

  getSObjectFieldType(fieldName: string): Soql.SObjectFieldType {
    return this.sobjectTypeUtils
      ? this.sobjectTypeUtils.getType(fieldName)
      : Soql.SObjectFieldType.AnyType;
  }

  getPicklistValues(fieldName: string): string[] {
    // values need to be quoted
    return this.sobjectTypeUtils
      ? this.sobjectTypeUtils
          .getPicklistValues(fieldName)
          .map((value) => `'${value}'`)
      : [];
  }

  getCriteriaType(
    type: Soql.SObjectFieldType,
    value: string
  ): Soql.LiteralType {
    let criteriaType = Soql.LiteralType.String;
    if (value.toLowerCase() === 'null') {
      return Soql.LiteralType.NULL;
    } else {
      switch (type) {
        case Soql.SObjectFieldType.Boolean: {
          criteriaType = Soql.LiteralType.Boolean;
          break;
        }
        case Soql.SObjectFieldType.Currency: {
          criteriaType = Soql.LiteralType.Currency;
          break;
        }
        case Soql.SObjectFieldType.DateTime:
        case Soql.SObjectFieldType.Date:
        case Soql.SObjectFieldType.Time: {
          criteriaType = Soql.LiteralType.Date;
          break;
        }
        case Soql.SObjectFieldType.Integer:
        case Soql.SObjectFieldType.Long:
        case Soql.SObjectFieldType.Percent:
        case Soql.SObjectFieldType.Double: {
          criteriaType = Soql.LiteralType.Number;
          break;
        }
      }
    }
    return criteriaType;
  }

  validateInput(): boolean {
    if (this.checkAllModifiersHaveValues()) {
      this.resetErrorFlagsAndMessages();

      const fieldName = this.fieldEl.value;
      const op = this._currentOperatorValue = this.operatorEl.value;
      const opModelValue = this.toOperatorModelValue(op);

      this._criteriaDisplayValue = this.criteriaEl.value;
      const type = this.getSObjectFieldType(fieldName);
      const normalizedInput = this.normalizeInput(type, this.criteriaEl.value);
      const critType = this.getCriteriaType(type, normalizedInput);
      const picklistValues = this.getPicklistValues(fieldName);

      const validateOptions = {
        type,
        picklistValues
      };

      const isMultiInput = this.isMulipleValueOperator(this._currentOperatorValue);

      const inputValidator = isMultiInput
        ? ValidatorFactory.getFieldMultipleInputValidator(validateOptions)
        : ValidatorFactory.getFieldInputValidator(validateOptions);
      let result = inputValidator.validate(normalizedInput);
      if (!result.isValid) {
        this.errorMessage = this.criteriaErrorMessage = result.message;
        this.hasCriteriaError = true;
        return false;
      }

      const operatorValidator = ValidatorFactory.getOperatorValidator(validateOptions);
      result = operatorValidator.validate(op);
      if (!result.isValid) {
        this.errorMessage = this.operatorErrorMessage = result.message;
        this.hasOperatorError = true;
        return false;
      }

      const conditionTemplate = {
        field: { fieldName },
        operator: opModelValue
      };
      if (isMultiInput) {
        const rawValues = splitMultiInputValues(normalizedInput);
        const values = rawValues.map(value => {
          return {
            type: critType,
            value
          };
        });
        this.condition = {
          ...conditionTemplate,
          values
        };
      } else {
        this.condition = {
          ...conditionTemplate,
          compareValue: {
            type: critType,
            value: normalizedInput
          }
        };
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
        condition: this.condition,
        index: this.index
      }
    });
    this.dispatchEvent(modGroupSelectionEvent);
  }
}
