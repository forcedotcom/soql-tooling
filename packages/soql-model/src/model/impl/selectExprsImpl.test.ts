/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as Impl from '.';

describe('SelectExprsImpl should', () => {
  it('store select expressions', () => {
    const expected = {
      selectExpressions: [{ fieldName: 'sticky' }, { fieldName: 'fingers' }],
    };
    const actual = new Impl.SelectExprsImpl([
      new Impl.FieldRefImpl(expected.selectExpressions[0].fieldName),
      new Impl.FieldRefImpl(expected.selectExpressions[1].fieldName),
    ]);
    expect(actual).toEqual(expected);
  });
  it('return SELECT * when there are no select expressions for toSoqlSyntax()', () => {
    const expected = 'SELECT *';
    const actual = new Impl.SelectExprsImpl([]).toSoqlSyntax();
    expect(actual).toEqual(expected);
  });
  it('return comma separated list of fields for toSoqlSyntax()', () => {
    const expected = 'SELECT let, it, bleed';
    const actual = new Impl.SelectExprsImpl([
      new Impl.FieldRefImpl('let'),
      new Impl.FieldRefImpl('it'),
      new Impl.FieldRefImpl('bleed'),
    ]).toSoqlSyntax();
    expect(actual).toEqual(expected);
  });
});
