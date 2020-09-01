/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as Impl from '.';

describe('UnmodeledSyntaxImpl should', () => {
  it('store a string as unmodeledSyntax', () => {
    const expected = { unmodeledSyntax: 'ronnie' };
    const actual = new Impl.UnmodeledSyntaxImpl(expected.unmodeledSyntax);
    expect(actual).toEqual(expected);
  });
  it('return stored syntax for toSoqlSyntax()', () => {
    const expected = 'keith';
    const actual = new Impl.UnmodeledSyntaxImpl(expected).toSoqlSyntax();
    expect(actual).toEqual(expected);
  });
});
