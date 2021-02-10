export type IndexableArrayItem<T> = {
  index: number;
  item: T;
}

export type IndexableArray<T> = IndexableArrayItem<string>[];
export function lwcIndexableArray<T>(arr): IndexableArray<T> {
  return arr.map((item: T, index: number) => { return { index, item }});
}
