type ArrayBase<T> = T extends (infer R)[] ? R : never;
export type RowKey<TRow, TKey extends (keyof TRow)[]> = Pick<TRow, ArrayBase<TKey>>;

export interface RepositorySchema {
    readonly keys: (number | string | symbol)[];
    readonly columns: (number | string | symbol)[];
    getKey(row);
    createRow();
}
