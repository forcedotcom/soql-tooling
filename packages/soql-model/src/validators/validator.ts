/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { Messages } from '../messages/messages';
import { SObjectFieldType } from '../model/model';

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
  { description: OPERATOR_EQ, display: '=' },
  { description: OPERATOR_NOT_EQ, display: '!=' },
  { description: OPERATOR_ALT_NOT_EQ, display: '<>' },
  { description: OPERATOR_LT_EQ, display: '<=' },
  { description: OPERATOR_GT_EQ, display: '>=' },
  { description: OPERATOR_LT, display: '<' },
  { description: OPERATOR_GT, display: '>' },
  { description: OPERATOR_LIKE, display: 'LIKE' },
  { description: OPERATOR_IN, display: 'IN' },
  { description: OPERATOR_NOT_IN, display: 'NOT IN' },
  { description: OPERATOR_INCLUDES, display: 'INCLUDES' },
  { description: OPERATOR_EXCLUDES, display: 'EXCLUDES' }
]

export abstract class OperatorValidator extends Validator {
  public abstract getAcceptedOperators(): string[];
  public validate(input: string): ValidateResult {
    const isValid = this.getAcceptedOperators().includes(input.toUpperCase().trim());
    const operator = allOperators.find(operator => operator.description === input.toUpperCase().trim());
    const display = operator ? operator.display : input;
    const message = isValid ? undefined : Messages.error_operatorInput.replace('{0}', display);
    return { isValid, message };
  }
}

export class DefaultOperatorValidator extends OperatorValidator {
  public getAcceptedOperators(): string[] {
    return allOperators.map(operator => operator.description);
  }
}
