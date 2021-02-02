/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { Messages } from '../messages/messages';
import { ValidateResult, Validator } from './validator';

export class PicklistValidator extends Validator {
  public validate(input: string): ValidateResult {
    let isValid = true;
    let message;
    if (this.options.picklistValues) {
      isValid = this.options.picklistValues.includes(input);
      if (!isValid) {
        const commaSeparatedValues = this.options.picklistValues.reduce((soFar, next) => {
          if (soFar.length > 0) {
            soFar += ', ';
          }
          soFar += next;
          return soFar;
        });
        message = Messages.error_fieldInput_picklist.replace('{0}', commaSeparatedValues);
      }
    }
    return { isValid, message };
  }
}
