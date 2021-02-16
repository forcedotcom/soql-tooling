/*
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 */
import { api, LightningElement, track } from 'lwc';
import { debounce } from 'debounce';
import {
  Soql,
  ValidatorFactory,
  splitMultiInputValues
} from '@salesforce/soql-model';
import { JsonMap } from '@salesforce/types';
import { operatorOptions } from '../services/model';
import { SObjectTypeUtils } from '../services/sobjectUtils';
import {
  displayValueToSoqlStringLiteral,
  soqlStringLiteralToDisplayValue,
  addWildCardToValue,
  stripWildCardPadding
} from '../services/soqlUtils';

const DEFAULT_FIELD_INPUT_VALUE = '';
const DEFAULT_OPERATOR_INPUT_VALUE = 'EQ';
const DEFAULT_CRITERIA_INPUT_VALUE = '';

export default class WhereModifierGroup extends LightningElement {
  @api allFields: string[];
  @api isLoading = false;
  @api index;
  @track _currentFieldSelection;
  @track _criteriaDisplayValue;
  sobjectTypeUtils: SObjectTypeUtils;
  fieldEl: HTMLSelectElement;
  operatorEl: HTMLSelectElement;
  criteriaEl: HTMLInputElement;
  operatorErrorMessage = '';
  criteriaErrorMessage = '';
  hasOperatorError = false;
  hasCriteriaError = false;
  selectPlaceHolderText = 'Search Fields...'; //i18n
  _allModifiersHaveValue: boolean = false;
  _sobjectMetadata: any;
  _condition: JsonMap;
  _currentOperatorValue: string;
  handleSelectionEvent: () => void;

  @api
  get sobjectMetadata() {
    return this._sobjectMetadata;
  }
  set sobjectMetadata(sobjectMetadata: any) {
    this._sobjectMetadata = sobjectMetadata;
    this.sobjectTypeUtils = new SObjectTypeUtils(sobjectMetadata);
    this.resetErrorFlagsAndMessages();
  }

  @api // this need to be public so parent can read value
  get allModifiersHaveValue() {
    return this._allModifiersHaveValue;
  }

  @api
  get condition(): JsonMap {
    return this._condition;
  }

  set condition(condition: JsonMap) {
    this._condition = condition;
    this._criteriaDisplayValue = '';

    this._currentFieldSelection = this.getFieldName();

    const matchingOption = condition
      ? operatorOptions.find((option) => option.predicate(condition))
      : undefined;
    this._currentOperatorValue = matchingOption
      ? matchingOption.value
      : undefined;

    if (
      this._selectedOperator &&
      this.isMulipleValueOperator(this._selectedOperator.value)
    ) {
      if (Array.isArray(condition.values)) {
        this._criteriaDisplayValue = condition.values
          .map((value) => value.value)
          .join(', ');
      }
    } else {
      if (
        condition.compareValue &&
        condition.compareValue.type &&
        condition.compareValue.value &&
        matchingOption &&
        matchingOption.value
      ) {
        this._criteriaDisplayValue = this.displayValue(
          condition.compareValue.type,
          condition.compareValue.value,
          matchingOption.value
        );
      }
    }
  }
  /* ======= CSS CLASS METHODS ======= */
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
  /* --------------------------------- */
  constructor() {
    super();
    this.handleSelectionEvent = debounce(selectionEventHandler.bind(this), 500);
  }
  /* ======= LIFECYCLE HOOKS ======= */
  renderedCallback() {
    this.fieldEl = this.template.querySelector('querybuilder-custom-select');
    this.operatorEl = this.template.querySelector(
      '[data-el-where-operator-input]'
    );
    this.criteriaEl = this.template.querySelector(
      '[data-el-where-criteria-input]'
    );
    this.checkAllModifiersHaveValues();
  }

  /* ======= FIELDS ======= */
  get _selectedField() {
    return this._currentFieldSelection ? [this._currentFieldSelection] : [];
  }

  get defaultFieldOptionText() {
    // TODO: i18n
    return this.isLoading ? 'Loading...' : 'Select Field...';
  }

  getFieldName(): string | undefined {
    return this.condition &&
      this.condition.field &&
      this.condition.field.fieldName
      ? this.condition.field.fieldName
      : undefined;
  }

  /* ======= OPERATORS ======= */
  get hasSelectedOperator() {
    return !!this._currentOperatorValue;
  }
  // consumed in UI template for rendering
  get _selectedOperator() {
    return operatorOptions.find(
      (option) => option.value === this._currentOperatorValue
    );
  }

  get filteredOperators() {
    return operatorOptions.filter((option) => {
      return option.value !== this._currentOperatorValue;
    });
  }

  toOperatorModelValue(value: string): string | undefined {
    const matchingOption = operatorOptions.find(
      (option) => option.value === value
    );
    return matchingOption ? matchingOption.modelValue : undefined;
  }

  /* ======= CRITERIA ======= */
  get criteriaDisplayValue(): string | undefined {
    return this._criteriaDisplayValue;
  }

  /* ======= UTILITIES ======= */
  resetErrorFlagsAndMessages() {
    this.operatorErrorMessage = this.criteriaErrorMessage = '';
    this.hasOperatorError = this.hasCriteriaError = false;
  }

  checkAllModifiersHaveValues(): Boolean {
    const allHaveValues = Boolean(
      this.fieldEl.value[0] && this.operatorEl.value && this.criteriaEl.value
    );
    this._allModifiersHaveValue = allHaveValues;
    return allHaveValues;
  }

  isMulipleValueOperator(operatorValue: string): boolean {
    return (
      operatorValue === Soql.UiOperatorValue.IN ||
      operatorValue === Soql.UiOperatorValue.NOT_IN ||
      operatorValue === Soql.UiOperatorValue.INCLUDES ||
      operatorValue === Soql.UiOperatorValue.EXCLUDES
    );
  }

  isSpecialLikeCondition(operatorValue: string): boolean {
    return (
      operatorValue === Soql.UiOperatorValue.LIKE_START ||
      operatorValue === Soql.UiOperatorValue.LIKE_END ||
      operatorValue === Soql.UiOperatorValue.LIKE_CONTAINS
    );
  }
  // This is the value displayed in modifier <input>
  displayValue(
    type: Soql.LiteralType,
    rawValue: string,
    operatorValue?: string
  ): string {
    let displayValue = rawValue;
    switch (type) {
      case Soql.LiteralType.String: {
        displayValue = soqlStringLiteralToDisplayValue(rawValue);
        if (this.isSpecialLikeCondition(operatorValue)) {
          displayValue = stripWildCardPadding(displayValue);
        }
        break;
      }
    }
    return displayValue;
  }
  // This is represents the compareValue in the SOQL Query
  normalizeInput(
    type: Soql.SObjectFieldType,
    value: string,
    operatorValue?: Soql.UiOperatorValue
  ): string {
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
            if (this.isSpecialLikeCondition(operatorValue)) {
              let wildCardValue = addWildCardToValue(operatorValue, value);
              normalized = displayValueToSoqlStringLiteral(wildCardValue);
            } else {
              normalized = displayValueToSoqlStringLiteral(normalized);
            }
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

      const fieldName = (this._currentFieldSelection = this.fieldEl.value[0]);
      const op = (this._currentOperatorValue = this.operatorEl.value);
      const opModelValue = this.toOperatorModelValue(op);

      this._criteriaDisplayValue = this.criteriaEl.value;
      const type = this.getSObjectFieldType(fieldName);
      const normalizedInput = this.normalizeInput(
        type,
        this.criteriaEl.value,
        op
      );
      const critType = this.getCriteriaType(type, normalizedInput);
      const picklistValues = this.getPicklistValues(fieldName);

      const validateOptions = {
        type,
        picklistValues
      };

      const isMultiInput = this.isMulipleValueOperator(
        this._currentOperatorValue
      );

      const inputValidator = isMultiInput
        ? ValidatorFactory.getFieldMultipleInputValidator(validateOptions)
        : ValidatorFactory.getFieldInputValidator(validateOptions);
      let result = inputValidator.validate(normalizedInput);
      if (!result.isValid) {
        this.errorMessage = this.criteriaErrorMessage = result.message;
        this.hasCriteriaError = true;
        return false;
      }

      const operatorValidator = ValidatorFactory.getOperatorValidator(
        validateOptions
      );
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
        const endsWithCommaAndOptionalSpaceRegex = /,\s*$/; // matches ',' or ', ' or ',  '
        if (
          normalizedInput &&
          !endsWithCommaAndOptionalSpaceRegex.test(normalizedInput)
        ) {
          const rawValues = splitMultiInputValues(normalizedInput);
          const values = rawValues.map((value) => {
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
          // Do not trigger update. User is still typing or not finished their input.
        }
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
  /* ======= EVENT HANDLERS ======= */
  handleConditionRemoved(e) {
    // reset inputs to defaults
    this._currentFieldSelection = DEFAULT_FIELD_INPUT_VALUE;
    this._currentOperatorValue = DEFAULT_OPERATOR_INPUT_VALUE;
    this._criteriaDisplayValue = DEFAULT_CRITERIA_INPUT_VALUE;
    this.resetErrorFlagsAndMessages();

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
}

function selectionEventHandler(e) {
  e.preventDefault();
  // note: this.validateInput() will change state by setting this.condition
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
