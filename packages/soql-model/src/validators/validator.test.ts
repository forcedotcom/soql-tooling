/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Messages } from '../messages/messages';
import { SObjectFieldType } from '../model/model';
import { DefaultOperatorValidator, DefaultValidator } from './validator';

describe('DefaultValidator should', () => {
  it('return valid result', () => {
    const expected = { isValid: true };
    const actual = new DefaultValidator({ type: SObjectFieldType.AnyType }).validate('anything');
    expect(actual).toEqual(expected);
  });
});

describe('DefaultOperatorValidator should', () => {
  const validator = new DefaultOperatorValidator({ type: SObjectFieldType.AnyType });
  it('return valid result for any SOQL operator', () => {
    const expected = { isValid: true };
    expect(validator.validate('includes')).toEqual(expected);
  });
  it('return not valid result for unrecognized operator', () => {
    const expected = { isValid: false, message: Messages.error_operatorInput.replace('{0}', 'unrecognized') };
    expect(validator.validate('unrecognized')).toEqual(expected);
  });
});
