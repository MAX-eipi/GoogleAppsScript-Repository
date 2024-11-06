class GenericDatabaseTableSchema<TRecord, TRowKey extends keyof TRecord> implements DatabaseSchema<TRecord, TRowKey> {
    private readonly _factory: () => TRecord;
    private readonly _columns: (keyof TRecord)[];
    private readonly _keyColumns: TRowKey[];

    public get columns(): (keyof TRecord)[] { return this._columns; }
    public get keyColumns(): TRowKey[] { return this._keyColumns; }

    private _primaryColumn: keyof TRecord;
    public get primaryColumn(): keyof TRecord { return this._primaryColumn; }
    public set primaryColumn(value: keyof TRecord) { this._primaryColumn = value; }

    public constructor(factory: { new(): TRecord }, keys: TRowKey[]) {
        this._factory = () => new factory();
        this._columns = Object.keys(this._factory()) as (keyof TRecord)[];
        this._keyColumns = keys;
    }

    public instantiateRecord(): TRecord {
        return this._factory();
    }

    public instantiateRecordByParameter(parameter: Required<TRecord>): TRecord {
        const instance = this.instantiateRecord();
        for (const column of this.columns) {
            instance[column] = parameter[column];
        }
        return instance;
    }
}
