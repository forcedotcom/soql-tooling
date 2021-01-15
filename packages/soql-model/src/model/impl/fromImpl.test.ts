/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as Impl from '.';

describe('FromImpl should', () => {
  it('store SObject name as a string', () => {
    const expected = { sobjectName: 'ian' };
    const actual = new Impl.FromImpl('ian');
    expect(actual).toEqual(expected);
  });
  it('store as and using clauses as unmodeled syntax', () => {
    const expected = {
      sobjectName: 'black',
      as: { unmodeledSyntax: 'and' },
      using: { unmodeledSyntax: 'blue' },
    };
    const actual = new Impl.FromImpl(
      expected.sobjectName,
      new Impl.UnmodeledSyntaxImpl(expected.as.unmodeledSyntax),
      new Impl.UnmodeledSyntaxImpl(expected.using.unmodeledSyntax)
    );
    expect(actual).toEqual(expected);
  });
  it('return FROM sobject name followed by as and using clauses for toSoqlSyntax()', () => {
    const expected = 'FROM exile on main';
    const actual = new Impl.FromImpl(
      'exile',
      new Impl.UnmodeledSyntaxImpl('on'),
      new Impl.UnmodeledSyntaxImpl('main')
    ).toSoqlSyntax();
    expect(actual).toEqual(expected);
  });
});
