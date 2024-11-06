interface DatabaseSchema<TRecord, TRecordKey extends keyof TRecord> {
    readonly columns: (keyof TRecord)[];
    readonly keyColumns: TRecordKey[];
    readonly primaryColumn: keyof TRecord;

    instantiateRecord(): TRecord;
    instantiateRecordByParameter(parameter: Required<TRecord>): TRecord;
}
