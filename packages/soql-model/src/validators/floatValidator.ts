/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { Messages } from '../messages/messages';
import { OperatorValidator, OPERATOR_ALT_NOT_EQ, OPERATOR_EQ, OPERATOR_GT, OPERATOR_GT_EQ, OPERATOR_LT, OPERATOR_LT_EQ, OPERATOR_NOT_EQ, ValidateResult, Validator } from './validator';

export class FloatValidator extends Validator {
  public validate(input: string): ValidateResult {
    const isValid = /^[+-]?[0-9]*[.]?[0-9]+$/.test(input.trim());
    const message = isValid ? undefined : Messages.error_fieldInput_float;
    return { isValid, message };
  }
}

export class FloatOperatorValidator extends OperatorValidator {
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
