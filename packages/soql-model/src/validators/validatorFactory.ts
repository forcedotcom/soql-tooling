/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { SObjectFieldType } from '../model/model';
import { BooleanValidator, BooleanOperatorValidator } from './booleanValidator';
import { CurrencyValidator, CurrencyOperatorValidator } from './currencyValidator';
import { DateOperatorValidator, DateValidator } from './dateValidator';
import { FloatOperatorValidator, FloatValidator } from './floatValidator';
import { IntegerOperatorValidator, IntegerValidator } from './integerValidator';
import { PicklistValidator } from './picklistValidator';
import { DefaultOperatorValidator, DefaultValidator, ValidateOptions, Validator } from './validator';

export class ValidatorFactory {
  static getFieldInputValidator(options: ValidateOptions): Validator {
    switch (options.type) {
      case SObjectFieldType.Boolean: {
        return new BooleanValidator(options);
      }
      case SObjectFieldType.Currency: {
        return new CurrencyValidator(options);
      }
      case SObjectFieldType.Date:
      case SObjectFieldType.DateTime: {
        return new DateValidator(options);
      }
      case SObjectFieldType.Double: {
        return new FloatValidator(options);
      }
      case SObjectFieldType.Integer:
      case SObjectFieldType.Long: {
        return new IntegerValidator(options);
      }
      case SObjectFieldType.Picklist:
      case SObjectFieldType.MultiPicklist: {
        return new PicklistValidator(options);
      }
    }
    return new DefaultValidator(options);
  }

  static getOperatorValidator(options: ValidateOptions): Validator {
    switch (options.type) {
      case SObjectFieldType.Boolean: {
        return new BooleanOperatorValidator(options);
      }
      case SObjectFieldType.Currency: {
        return new CurrencyOperatorValidator(options);
      }
      case SObjectFieldType.Date:
      case SObjectFieldType.DateTime: {
        return new DateOperatorValidator(options);
      }
      case SObjectFieldType.Double: {
        return new FloatOperatorValidator(options);
      }
      case SObjectFieldType.Integer:
      case SObjectFieldType.Long: {
        return new IntegerOperatorValidator(options);
      }
    }
    return new DefaultOperatorValidator(options);
  }
}
