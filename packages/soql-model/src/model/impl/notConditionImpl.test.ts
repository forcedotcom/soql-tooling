/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as Impl from '.';
import { CompareOperator, LiteralType } from '../model';

describe('NotConditionImpl should', () => {
  it('store condition', () => {
    const expected = { condition: { field: { fieldName: 'field' }, operator: '=', compareValue: { type: 'STRING', value: "'abc'" } } };
    const actual = new Impl.NotConditionImpl(
      new Impl.FieldCompareConditionImpl(
        new Impl.FieldRefImpl('field'),
        CompareOperator.EQ,
        new Impl.LiteralImpl(LiteralType.String, "'abc'")
      )
    );
    expect(actual).toEqual(expected);
  });
  it('return condition preceded by NOT keyword for toSoqlSyntax()', () => {
    const expected = "NOT field = 'abc'"
    const actual = new Impl.NotConditionImpl(
      new Impl.FieldCompareConditionImpl(
        new Impl.FieldRefImpl('field'),
        CompareOperator.EQ,
        new Impl.LiteralImpl(LiteralType.String, "'abc'")
      )
    ).toSoqlSyntax();
    expect(actual).toEqual(expected);
  });
});
