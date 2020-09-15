/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { SoqlModelUtils } from './util';
import * as Impl from './impl';
import { ErrorType, Query } from './model';

describe('SoqlModelUtils should', () => {
  it('return true if SOQL query model contains unmodeled syntax', () => {
    const actual = SoqlModelUtils.containsUnmodeledSyntax(
      new Impl.QueryImpl(
        new Impl.SelectExprsImpl([
          new Impl.FieldRefImpl(
            'field1',
            new Impl.UnmodeledSyntaxImpl('alias1')
          ),
        ]),
        new Impl.FromImpl('object1')
      )
    );
    expect(actual).toBeTruthy();
  });
  it('return false if SOQL query model does not contain unmodeled syntax', () => {
    const actual = SoqlModelUtils.containsUnmodeledSyntax(
      new Impl.QueryImpl(
        new Impl.SelectExprsImpl([new Impl.FieldRefImpl('field1')]),
        new Impl.FromImpl('object1')
      )
    );
    expect(actual).toBeFalsy();
  });
  it('return true if SOQL query model contains error', () => {
    const model: Query = new Impl.QueryImpl(
      new Impl.SelectExprsImpl([new Impl.FieldRefImpl('field1')]),
      new Impl.FromImpl('object1')
    );
    model.errors = [{ type: ErrorType.UNKNOWN, message: 'ERROR', lineNumber: 1, charInLine: 1 }];

    const actual = SoqlModelUtils.containsError(model);
    expect(actual).toBeTruthy();
  });
  it('return false if SOQL query model does not contain error', () => {
    const model: Query = new Impl.QueryImpl(
      new Impl.SelectExprsImpl([new Impl.FieldRefImpl('field1')]),
      new Impl.FromImpl('object1')
    );

    const actual = SoqlModelUtils.containsError(model);
    expect(actual).toBeFalsy();
  });
});
