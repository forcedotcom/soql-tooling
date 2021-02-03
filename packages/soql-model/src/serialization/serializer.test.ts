/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { ModelSerializer } from './serializer';
import * as Impl from '../model/impl';
import { HeaderCommentsImpl } from '../model/impl/headerCommentsImpl';

describe('ModelSerializer should', () => {
  it('transform model to SOQL syntax', () => {
    const expected = 'SELECT field\n  FROM object\n';
    const actual = new ModelSerializer(
      new Impl.QueryImpl(
        new Impl.SelectExprsImpl([new Impl.FieldRefImpl('field')]),
        new Impl.FromImpl('object')
      )
    ).serialize();
    expect(actual).toEqual(expected);
  });

  it('transform model with comments to SOQL syntax', () => {
    const expected =
      '// Comment 1\n// Comment 2\nSELECT field\n  FROM object\n';

    const query = new Impl.QueryImpl(
      new Impl.SelectExprsImpl([new Impl.FieldRefImpl('field')]),
      new Impl.FromImpl('object')
    );
    query.headerComments = new HeaderCommentsImpl(
      '// Comment 1\n// Comment 2\n'
    );
    const actual = new ModelSerializer(query).serialize();
    expect(actual).toEqual(expected);
  });
});
