/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Messages } from '../messages/messages';
import { SObjectFieldType } from '../model/model';
import { StringValidator } from './stringValidator';

describe('StringValidator should', () => {
  const validator = new StringValidator({ type: SObjectFieldType.String });
  const validResult = { isValid: true };
  const notValidResult = { isValid: false, message: Messages.error_fieldInput_string };
  it('return valid result for string in single quotes', () => {
    expect(validator.validate("'foo'")).toEqual(validResult);
  });
  it('return not valid result for non-string value', () => {
    expect(validator.validate('foo')).toEqual(notValidResult);
  });
  it('return not valid result for string ending in escaped quote', () => {
    expect(validator.validate("'foo\\'")).toEqual(notValidResult);
  })
});
