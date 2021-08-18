import { DatabaseSchema } from "./DatabaseTableSchema";

export interface DatabaseTable<TRecord, TRecordKey extends keyof TRecord> {
    readonly schema: DatabaseSchema<TRecord, TRecordKey>;
    readonly records: TRecord[];

    find(key: Pick<TRecord, TRecordKey>): TRecord;
    findAll(keys: Pick<TRecord, TRecordKey> | (Pick<TRecord, TRecordKey>)[]): TRecord[];
    update(records: Required<TRecord> | Required<TRecord>[]): { added: TRecord[]; updated: TRecord[] };
}
