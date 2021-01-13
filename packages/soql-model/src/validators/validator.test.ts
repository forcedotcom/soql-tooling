/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Messages } from '../messages/messages';
import { SObjectFieldType } from '../model/model';
import { DefaultValidator, OperatorValidator } from './validator';

describe('DefaultValidator should', () => {
  it('return valid result', () => {
    const expected = { isValid: true };
    const actual = new DefaultValidator({ type: SObjectFieldType.AnyType }).validate('anything');
    expect(actual).toEqual(expected);
  });
});

describe('OperatorValidator should', () => {
  const booleanOperatorValidator = new OperatorValidator({ type: SObjectFieldType.Boolean });
  const currencyOperatorValidator = new OperatorValidator({ type: SObjectFieldType.Currency });
  const dateOperatorValidator = new OperatorValidator({ type: SObjectFieldType.Date });
  const numericOperatorValidator = new OperatorValidator({ type: SObjectFieldType.Long });
  const stringOperatorValidator = new OperatorValidator({ type: SObjectFieldType.String });
  it('return valid result for accepted operator', () => {
    const expected = { isValid: true };
    expect(booleanOperatorValidator.validate('eq')).toEqual(expected);
    expect(currencyOperatorValidator.validate('eq')).toEqual(expected);
    expect(dateOperatorValidator.validate('eq')).toEqual(expected);
    expect(numericOperatorValidator.validate('eq')).toEqual(expected);
    expect(stringOperatorValidator.validate('eq')).toEqual(expected);
  });
  it('return not valid result for not accepted operator', () => {
    const expected = { isValid: false, message: Messages.error_operatorInput.replace('{0}', 'LIKE') };
    expect(booleanOperatorValidator.validate('like')).toEqual(expected);
    expect(currencyOperatorValidator.validate('like')).toEqual(expected);
    expect(dateOperatorValidator.validate('like')).toEqual(expected);
    expect(numericOperatorValidator.validate('like')).toEqual(expected);
  });
  it('return not valid result for unrecognized operator', () => {
    const expected = { isValid: false, message: Messages.error_operatorInput.replace('{0}', 'unrecognized') };
    expect(booleanOperatorValidator.validate('unrecognized')).toEqual(expected);
    expect(currencyOperatorValidator.validate('unrecognized')).toEqual(expected);
    expect(dateOperatorValidator.validate('unrecognized')).toEqual(expected);
    expect(numericOperatorValidator.validate('unrecognized')).toEqual(expected);
    expect(stringOperatorValidator.validate('unrecognized')).toEqual(expected);
  });
});
