/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as Impl from '.';
import { LiteralType } from '../model';

describe('LikeConditionImpl should', () => {
  it('store field and value', () => {
    const expected = { field: { fieldName: 'field' }, compareValue: { type: 'STRING', value: "'abc'" } };
    const actual = new Impl.LikeConditionImpl(
      new Impl.FieldRefImpl('field'),
      new Impl.LiteralImpl(LiteralType.String, "'abc'")
    );
    expect(actual).toEqual(expected);
  });
  it('return field, LIKE keyword, and value separated by spaces for toSoqlSyntax()', () => {
    const expected = `field LIKE 'abc'`;
    const actual = new Impl.LikeConditionImpl(
      new Impl.FieldRefImpl('field'),
      new Impl.LiteralImpl(LiteralType.String, "'abc'")
    ).toSoqlSyntax();
    expect(actual).toEqual(expected);
  });
});
