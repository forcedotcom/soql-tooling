/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { Messages } from '../messages/messages';
import { SObjectFieldType } from '../model/model';
import { splitMultiInputValues } from './inputUtils';

export interface ValidateOptions {
  type: SObjectFieldType;
  nillable?: boolean;
  picklistValues?: string[];
}

export interface ValidateResult {
  isValid: boolean;
  message?: string;
}

export abstract class Validator {
  constructor(protected options: ValidateOptions) {
  }
  public abstract validate(input: string): ValidateResult;
}

export class DefaultValidator extends Validator {
  public validate(input: string): ValidateResult {
    return { isValid: true };
  }
}

export const OPERATOR_EQ = 'EQ';
export const OPERATOR_NOT_EQ = 'NOT_EQ';
export const OPERATOR_ALT_NOT_EQ = 'ALT_NOT_EQ';
export const OPERATOR_LT_EQ = 'LT_EQ';
export const OPERATOR_GT_EQ = 'GT_EQ';
export const OPERATOR_LT = 'LT';
export const OPERATOR_GT = 'GT';
export const OPERATOR_LIKE = 'LIKE';
export const OPERATOR_IN = 'IN';
export const OPERATOR_NOT_IN = 'NOT_IN';
export const OPERATOR_INCLUDES = 'INCLUDES';
export const OPERATOR_EXCLUDES = 'EXCLUDES';

interface Operator {
  description: string;
  display: string;
}

const allOperators = [
  { description: OPERATOR_EQ, display: '=', types: [SObjectFieldType.Address, SObjectFieldType.AnyType, SObjectFieldType.Base64, SObjectFieldType.Boolean, SObjectFieldType.Combobox, SObjectFieldType.ComplexValue, SObjectFieldType.Currency, SObjectFieldType.Date, SObjectFieldType.DateTime, SObjectFieldType.Double, SObjectFieldType.Email, SObjectFieldType.EncryptedString, SObjectFieldType.Id, SObjectFieldType.Integer, SObjectFieldType.Location, SObjectFieldType.Long, SObjectFieldType.MultiPicklist, SObjectFieldType.Percent, SObjectFieldType.Phone, SObjectFieldType.Picklist, SObjectFieldType.Reference, SObjectFieldType.String, SObjectFieldType.TextArea, SObjectFieldType.Time, SObjectFieldType.Url] },
  { description: OPERATOR_NOT_EQ, display: '!=', types: [SObjectFieldType.Address, SObjectFieldType.AnyType, SObjectFieldType.Base64, SObjectFieldType.Boolean, SObjectFieldType.Combobox, SObjectFieldType.ComplexValue, SObjectFieldType.Currency, SObjectFieldType.Date, SObjectFieldType.DateTime, SObjectFieldType.Double, SObjectFieldType.Email, SObjectFieldType.EncryptedString, SObjectFieldType.Id, SObjectFieldType.Integer, SObjectFieldType.Location, SObjectFieldType.Long, SObjectFieldType.MultiPicklist, SObjectFieldType.Percent, SObjectFieldType.Phone, SObjectFieldType.Picklist, SObjectFieldType.Reference, SObjectFieldType.String, SObjectFieldType.TextArea, SObjectFieldType.Time, SObjectFieldType.Url] },
  { description: OPERATOR_ALT_NOT_EQ, display: '<>', types: [SObjectFieldType.Address, SObjectFieldType.AnyType, SObjectFieldType.Base64, SObjectFieldType.Boolean, SObjectFieldType.Combobox, SObjectFieldType.ComplexValue, SObjectFieldType.Currency, SObjectFieldType.Date, SObjectFieldType.DateTime, SObjectFieldType.Double, SObjectFieldType.Email, SObjectFieldType.EncryptedString, SObjectFieldType.Id, SObjectFieldType.Integer, SObjectFieldType.Location, SObjectFieldType.Long, SObjectFieldType.MultiPicklist, SObjectFieldType.Percent, SObjectFieldType.Phone, SObjectFieldType.Picklist, SObjectFieldType.Reference, SObjectFieldType.String, SObjectFieldType.TextArea, SObjectFieldType.Time, SObjectFieldType.Url] },
  { description: OPERATOR_LT_EQ, display: '<=', types: [SObjectFieldType.Address, SObjectFieldType.AnyType, SObjectFieldType.Base64, SObjectFieldType.Combobox, SObjectFieldType.ComplexValue, SObjectFieldType.Currency, SObjectFieldType.Date, SObjectFieldType.DateTime, SObjectFieldType.Double, SObjectFieldType.Email, SObjectFieldType.EncryptedString, SObjectFieldType.Id, SObjectFieldType.Integer, SObjectFieldType.Location, SObjectFieldType.Long, SObjectFieldType.MultiPicklist, SObjectFieldType.Percent, SObjectFieldType.Phone, SObjectFieldType.Picklist, SObjectFieldType.Reference, SObjectFieldType.String, SObjectFieldType.TextArea, SObjectFieldType.Time, SObjectFieldType.Url] },
  { description: OPERATOR_GT_EQ, display: '>=', types: [SObjectFieldType.Address, SObjectFieldType.AnyType, SObjectFieldType.Base64, SObjectFieldType.Combobox, SObjectFieldType.ComplexValue, SObjectFieldType.Currency, SObjectFieldType.Date, SObjectFieldType.DateTime, SObjectFieldType.Double, SObjectFieldType.Email, SObjectFieldType.EncryptedString, SObjectFieldType.Id, SObjectFieldType.Integer, SObjectFieldType.Location, SObjectFieldType.Long, SObjectFieldType.MultiPicklist, SObjectFieldType.Percent, SObjectFieldType.Phone, SObjectFieldType.Picklist, SObjectFieldType.Reference, SObjectFieldType.String, SObjectFieldType.TextArea, SObjectFieldType.Time, SObjectFieldType.Url] },
  { description: OPERATOR_LT, display: '<', types: [SObjectFieldType.Address, SObjectFieldType.AnyType, SObjectFieldType.Base64, SObjectFieldType.Combobox, SObjectFieldType.ComplexValue, SObjectFieldType.Currency, SObjectFieldType.Date, SObjectFieldType.DateTime, SObjectFieldType.Double, SObjectFieldType.Email, SObjectFieldType.EncryptedString, SObjectFieldType.Id, SObjectFieldType.Integer, SObjectFieldType.Location, SObjectFieldType.Long, SObjectFieldType.MultiPicklist, SObjectFieldType.Percent, SObjectFieldType.Phone, SObjectFieldType.Picklist, SObjectFieldType.Reference, SObjectFieldType.String, SObjectFieldType.TextArea, SObjectFieldType.Time, SObjectFieldType.Url] },
  { description: OPERATOR_GT, display: '>', types: [SObjectFieldType.Address, SObjectFieldType.AnyType, SObjectFieldType.Base64, SObjectFieldType.Combobox, SObjectFieldType.ComplexValue, SObjectFieldType.Currency, SObjectFieldType.Date, SObjectFieldType.DateTime, SObjectFieldType.Double, SObjectFieldType.Email, SObjectFieldType.EncryptedString, SObjectFieldType.Id, SObjectFieldType.Integer, SObjectFieldType.Location, SObjectFieldType.Long, SObjectFieldType.MultiPicklist, SObjectFieldType.Percent, SObjectFieldType.Phone, SObjectFieldType.Picklist, SObjectFieldType.Reference, SObjectFieldType.String, SObjectFieldType.TextArea, SObjectFieldType.Time, SObjectFieldType.Url] },
  { description: OPERATOR_LIKE, display: 'LIKE', types: [SObjectFieldType.Address, SObjectFieldType.AnyType, SObjectFieldType.Combobox, SObjectFieldType.ComplexValue, SObjectFieldType.Email, SObjectFieldType.EncryptedString, SObjectFieldType.Id, SObjectFieldType.Location, SObjectFieldType.MultiPicklist, SObjectFieldType.Phone, SObjectFieldType.Picklist, SObjectFieldType.Reference, SObjectFieldType.String, SObjectFieldType.TextArea, SObjectFieldType.Url] },
  { description: OPERATOR_IN, display: 'IN', types: [SObjectFieldType.Address, SObjectFieldType.AnyType, SObjectFieldType.Base64, SObjectFieldType.Boolean, SObjectFieldType.Combobox, SObjectFieldType.ComplexValue, SObjectFieldType.Currency, SObjectFieldType.Date, SObjectFieldType.DateTime, SObjectFieldType.Double, SObjectFieldType.Email, SObjectFieldType.EncryptedString, SObjectFieldType.Id, SObjectFieldType.Integer, SObjectFieldType.Location, SObjectFieldType.Long, SObjectFieldType.MultiPicklist, SObjectFieldType.Percent, SObjectFieldType.Phone, SObjectFieldType.Picklist, SObjectFieldType.Reference, SObjectFieldType.String, SObjectFieldType.TextArea, SObjectFieldType.Time, SObjectFieldType.Url] },
  { description: OPERATOR_NOT_IN, display: 'NOT IN', types: [SObjectFieldType.Address, SObjectFieldType.AnyType, SObjectFieldType.Base64, SObjectFieldType.Boolean, SObjectFieldType.Combobox, SObjectFieldType.ComplexValue, SObjectFieldType.Currency, SObjectFieldType.Date, SObjectFieldType.DateTime, SObjectFieldType.Double, SObjectFieldType.Email, SObjectFieldType.EncryptedString, SObjectFieldType.Id, SObjectFieldType.Integer, SObjectFieldType.Location, SObjectFieldType.Long, SObjectFieldType.MultiPicklist, SObjectFieldType.Percent, SObjectFieldType.Phone, SObjectFieldType.Picklist, SObjectFieldType.Reference, SObjectFieldType.String, SObjectFieldType.TextArea, SObjectFieldType.Time, SObjectFieldType.Url] },
  { description: OPERATOR_INCLUDES, display: 'INCLUDES', types: [SObjectFieldType.MultiPicklist] },
  { description: OPERATOR_EXCLUDES, display: 'EXCLUDES', types: [SObjectFieldType.MultiPicklist] }
]

export class OperatorValidator extends Validator {
  public validate(input: string): ValidateResult {
    const operator = allOperators.find(operator => operator.description === input.toUpperCase().trim());
    const display = operator ? operator.display : input;
    const isValid = operator ? operator.types.includes(this.options.type) : false;
    const message = isValid ? undefined : Messages.error_operatorInput.replace('{0}', display);
    return { isValid, message };
  }
}

export class DefaultOperatorValidator extends OperatorValidator {
  public getAcceptedOperators(): string[] {
    return allOperators.map(operator => operator.description);
  }
}

export class MultipleInputValidator extends Validator {
  constructor(protected options: ValidateOptions, protected delegateValidator: Validator) {
    super(options);
  }
  public validate(input: string): ValidateResult {
    const values = splitMultiInputValues(input);
    if (values.length > 0) {
      for (let i = 0; i < values.length; i++) {
        const value = values[i];
        const result = this.delegateValidator.validate(value);
        if (!result.isValid) {
          return result;
        }
      }
    } else {
      return {
        isValid: false,
        message: Messages.error_fieldInput_list
      }
    }
    return { isValid: true };
  }
}
