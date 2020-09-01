/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as Impl from '.';

describe('FieldRefImpl should', () => {
  it('store a string field name as fieldName', () => {
    const expected = { fieldName: 'charlie' };
    const actual = new Impl.FieldRefImpl(expected.fieldName);
    expect(actual).toEqual(expected);
  });
  it('store an unmodeled syntax object as the alias', () => {
    const expected = { fieldName: 'brian', alias: { unmodeledSyntax: 'bill' } };
    const actual = new Impl.FieldRefImpl(
      expected.fieldName,
      new Impl.UnmodeledSyntaxImpl(expected.alias.unmodeledSyntax)
    );
    expect(actual).toEqual(expected);
  });
  it('return field name followed by alias for toSoqlSyntax()', () => {
    const expected = 'rolling stones';
    const actual = new Impl.FieldRefImpl(
      'rolling',
      new Impl.UnmodeledSyntaxImpl('stones')
    ).toSoqlSyntax();
    expect(actual).toEqual(expected);
  });
});
