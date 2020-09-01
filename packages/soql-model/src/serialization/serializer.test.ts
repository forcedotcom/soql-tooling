/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { ModelSerializer } from './serializer';
import * as Impl from '../model/impl';

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
});
