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
