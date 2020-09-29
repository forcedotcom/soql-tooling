/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as Impl from '.';

describe('QueryImpl should', () => {
  it('store query components as appropriate model objects', () => {
    const expected = {
      select: { selectExpressions: [] },
      from: { sobjectName: 'songs' },
      where: { unmodeledSyntax: 'paint it back' },
      with: { unmodeledSyntax: 'gimme shelter' },
      groupBy: { unmodeledSyntax: 'start me up' },
      orderBy: { orderByExpressions: [{ field: { fieldName: 'angie' } }] },
      limit: { limit: 5 },
      offset: { unmodeledSyntax: 'wild horses' },
      bind: { unmodeledSyntax: 'miss you' },
      recordTrackingType: { unmodeledSyntax: 'satisfaction' },
      update: { unmodeledSyntax: 'under my thumb' },
    };
    const actual = new Impl.QueryImpl(
      new Impl.SelectExprsImpl([]),
      new Impl.FromImpl(expected.from.sobjectName),
      new Impl.UnmodeledSyntaxImpl(expected.where.unmodeledSyntax),
      new Impl.UnmodeledSyntaxImpl(expected.with.unmodeledSyntax),
      new Impl.UnmodeledSyntaxImpl(expected.groupBy.unmodeledSyntax),
      new Impl.OrderByImpl([new Impl.OrderByExpressionImpl(new Impl.FieldRefImpl(expected.orderBy.orderByExpressions[0].field.fieldName))]),
      new Impl.LimitImpl(expected.limit.limit),
      new Impl.UnmodeledSyntaxImpl(expected.offset.unmodeledSyntax),
      new Impl.UnmodeledSyntaxImpl(expected.bind.unmodeledSyntax),
      new Impl.UnmodeledSyntaxImpl(expected.recordTrackingType.unmodeledSyntax),
      new Impl.UnmodeledSyntaxImpl(expected.update.unmodeledSyntax)
    );
    expect(actual).toEqual(expected);
  });
  it('return query string, one line per clause with all but SELECT clause indented for toSoqlSyntax()', () => {
    const expected = 'SELECT \n' + '  FROM songs\n' + '  paint it black\n';
    const actual = new Impl.QueryImpl(
      new Impl.SelectExprsImpl([]),
      new Impl.FromImpl('songs'),
      new Impl.UnmodeledSyntaxImpl('paint it black')
    ).toSoqlSyntax();
    expect(actual).toEqual(expected);
  });
});
