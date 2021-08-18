type ArrayBase<T> = T extends (infer R)[] ? R : never;
export type RowKey<TRow, TKey extends (keyof TRow)[]> = Pick<TRow, ArrayBase<TKey>>;

//export interface RepositorySchema {
//    readonly keys: (number | string | symbol)[];
//    readonly columns: (number | string | symbol)[];

//    primaryColumn;

//    getKey(row);
//    createRow();
//}

export interface DatabaseTableSchema<TRecord, TRecordKey extends keyof TRecord> {
    readonly columns: (keyof TRecord)[];
    readonly keyColumns: TRecordKey[];
    readonly primaryColumn: keyof TRecord;

    createInstance(): TRecord;
    createInstanceByParameter(parameter: Required<TRecord>): TRecord;
}
