/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { Messages } from '../messages/messages';
import { OperatorValidator, OPERATOR_ALT_NOT_EQ, OPERATOR_EQ, OPERATOR_GT, OPERATOR_GT_EQ, OPERATOR_LT, OPERATOR_LT_EQ, OPERATOR_NOT_EQ, ValidateResult, Validator } from './validator';

export class CurrencyValidator extends Validator {
  public validate(input: string): ValidateResult {
    const isValid = isCurrencyLiteral(input);
    const message = isValid ? undefined : Messages.error_fieldInput_currency;
    return { isValid, message };
  }
}

export function isCurrencyLiteral(s: string): boolean {
  return /^[a-zA-Z]{3}[+-]?[0-9]*[.]?[0-9]+$/.test(s.trim());
}

export class CurrencyOperatorValidator extends OperatorValidator {
  public getAcceptedOperators(): string[] {
    return [
      OPERATOR_EQ,
      OPERATOR_NOT_EQ,
      OPERATOR_ALT_NOT_EQ,
      OPERATOR_LT_EQ,
      OPERATOR_GT_EQ,
      OPERATOR_LT,
      OPERATOR_GT
    ];
  }
}
