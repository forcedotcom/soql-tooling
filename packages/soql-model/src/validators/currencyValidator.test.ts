/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Messages } from '../messages/messages';
import { SObjectFieldType } from '../model/model';
import { CurrencyOperatorValidator, CurrencyValidator } from './currencyValidator';

describe('CurrencyValidatort should', () => {
  const validator = new CurrencyValidator({ type: SObjectFieldType.Currency });
  const validResult = { isValid: true };
  const notValidResult = { isValid: false, message: Messages.error_fieldInput_currency };
  it('return valid result for correctly formatted currency literals', () => {
    expect(validator.validate('USD+13.25')).toEqual(validResult);
    expect(validator.validate('ABC-13')).toEqual(validResult);
    expect(validator.validate('DEF134501')).toEqual(validResult);
  });
  it('return not valid result for incorrectly formatted currency literals', () => {
    expect(validator.validate('USD 13.25')).toEqual(notValidResult);
    expect(validator.validate('not currency')).toEqual(notValidResult);
  });
});

describe('CurrencyOperatorValidator should', () => {
  const validator = new CurrencyOperatorValidator({ type: SObjectFieldType.Currency });
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
