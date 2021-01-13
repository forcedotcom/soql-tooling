/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Messages } from '../messages/messages';
import { SObjectFieldType } from '../model/model';
import { IntegerOperatorValidator, IntegerValidator } from './integerValidator';

describe('IntegerValidator should', () => {
  const validator = new IntegerValidator({ type: SObjectFieldType.Integer });
  const validResult = { isValid: true };
  const notValidResult = { isValid: false, message: Messages.error_fieldInput_integer };
  it('return valid result for signed integer input', () => {
    expect(validator.validate(' -42')).toEqual(validResult);
  });
  it('return valid result for unsigned integer input', () => {
    expect(validator.validate('42')).toEqual(validResult);
  });
  it('return not valid result for floating point input', () => {
    expect(validator.validate('3.14')).toEqual(notValidResult);
  });
  it('return not valid result for non-numeric input', () => {
    expect(validator.validate('NaN')).toEqual(notValidResult);
  });
});

describe('IntegerOperatorValidator should', () => {
  const validator = new IntegerOperatorValidator({ type: SObjectFieldType.Integer });
  it('return valid result for accepted operator', () => {
    const expected = { isValid: true };
    expect(validator.validate('eq')).toEqual(expected);
  });
  it('return not valid result for not accepted operator', () => {
    const expected = { isValid: false, message: Messages.error_operatorInput.replace('{0}', 'LIKE') };
    expect(validator.validate('like')).toEqual(expected);
  });
  it('return not valid result for unrecognized operator', () => {
    const expected = { isValid: false, message: Messages.error_operatorInput.replace('{0}', 'unrecognized') };
    expect(validator.validate('unrecognized')).toEqual(expected);
  });
});
