/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as Impl from '.';

describe('FieldSelectionImpl should', () => {
  it('store a field', () => {
    const expected = { field: { fieldName: 'charlie' } };
    const actual = new Impl.FieldSelectionImpl(new Impl.FieldRefImpl(expected.field.fieldName));
    expect(actual).toEqual(expected);
  });
  it('store an unmodeled syntax object as the alias', () => {
    const expected = { field: { fieldName: 'brian' }, alias: { unmodeledSyntax: 'bill', reason: 'unmodeled:alias' } };
    const actual = new Impl.FieldSelectionImpl(
      new Impl.FieldRefImpl(expected.field.fieldName),
      new Impl.UnmodeledSyntaxImpl(expected.alias.unmodeledSyntax, 'unmodeled:alias')
    );
    expect(actual).toEqual(expected);
  });
  it('return field name followed by alias for toSoqlSyntax()', () => {
    const expected = 'rolling stones';
    const actual = new Impl.FieldSelectionImpl(
      new Impl.FieldRefImpl('rolling'),
      new Impl.UnmodeledSyntaxImpl('stones', 'unmodeled:alias')
    ).toSoqlSyntax();
    expect(actual).toEqual(expected);
  });
});
