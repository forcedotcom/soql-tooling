/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Messages } from '../messages/messages';
import { SObjectFieldType } from '../model/model';
import { FloatOperatorValidator, FloatValidator } from './floatValidator';

describe('FloatValidator should', () => {
  const validator = new FloatValidator({ type: SObjectFieldType.Double });
  const validResult = { isValid: true };
  const notValidResult = { isValid: false, message: Messages.error_fieldInput_float };
  it('return valid result for signed floating point input', () => {
    expect(validator.validate(' +3.14')).toEqual(validResult);
  });
  it('return valid result for unsigned floating point input', () => {
    expect(validator.validate('1.0 ')).toEqual(validResult);
  });
  it('return valid result for integer input', () => {
    expect(validator.validate('10')).toEqual(validResult);
  });
  it('return not valid result for non-numeric input', () => {
    expect(validator.validate('NaN')).toEqual(notValidResult);
  });
});

describe('FloatOperatorValidator should', () => {
  const validator = new FloatOperatorValidator({ type: SObjectFieldType.Double });
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
