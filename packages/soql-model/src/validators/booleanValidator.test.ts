/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Messages } from '../messages/messages';
import { SObjectFieldType } from '../model/model';
import { BooleanOperatorValidator, BooleanValidator } from './booleanValidator';

describe('BooleanValidator should', () => {
  const validator = new BooleanValidator({ type: SObjectFieldType.Boolean });
  const validResult = { isValid: true };
  const notValidResult = { isValid: false, message: Messages.error_fieldInput_boolean };
  it('return valid result for TRUE or FALSE', () => {
    expect(validator.validate(' true')).toEqual(validResult);
    expect(validator.validate('false ')).toEqual(validResult);
  });
  it('return not valid result for non-boolean value', () => {
    expect(validator.validate('not boolean')).toEqual(notValidResult);
  });
});

describe('BooleanOperatorValidator should', () => {
  const validator = new BooleanOperatorValidator({ type: SObjectFieldType.Boolean });
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
