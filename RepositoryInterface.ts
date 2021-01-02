export type ReadOnlyRow<T> = {
    readonly [P in keyof T]: T[P];
}

export interface Repository<TRow, TRowKey> {
    readonly rows: ReadOnlyRow<TRow>[];
    find(key: TRowKey): ReadOnlyRow<TRow>;
    findAll(keys: TRowKey[]): ReadOnlyRow<TRow>[];
}