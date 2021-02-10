export type IndexableArrayItem<T> = {
  index: number;
  item: T;
}

export type IndexableArray<T> = IndexableArrayItem<string>[];
export function lwcIndexableArray(arr): IndexableArray<string> {
  return arr.map((item: string, index: number) => { return { index, item }});
}
