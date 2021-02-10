import { lwcIndexableArray } from './lwcUtils';

describe('Lwc Utils Should', () => {
  it('turn simple array into an indexed array', () => {
    expect(lwcIndexableArray(['one', 'two', 'three'])).toEqual([{index: 0, item: 'one'}, {index: 1, item: 'two'}, {index: 2, item: 'three'}]);
  });
});
