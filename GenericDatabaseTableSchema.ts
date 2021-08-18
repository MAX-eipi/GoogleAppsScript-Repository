import { DatabaseTableSchema } from "./DatabaseTableSchema";

export class GenericDatabaseTableSchema<TRecord, TRowKey extends keyof TRecord> implements DatabaseTableSchema<TRecord, TRowKey> {
    private readonly _factory: () => TRecord;
    private readonly _columns: (keyof TRecord)[];
    private readonly _keyColumns: TRowKey[];

    public get columns(): (keyof TRecord)[] { return this._columns; }
    public get keyColumns(): TRowKey[] { return this._keyColumns; }

    private _primaryColumn: keyof TRecord;
    public get primaryColumn(): keyof TRecord { return this._primaryColumn; }
    public set primaryColumn(value: keyof TRecord) { this._primaryColumn = value; }

    public constructor(keys: TRowKey[], factory: () => TRecord) {
        this._factory = factory;
        this._columns = Object.keys(this._factory()) as (keyof TRecord)[];
        this._keyColumns = keys;
    }

    public createInstance(): TRecord {
        return this._factory();
    }

    public createInstanceByParameter(parameter: Required<TRecord>): TRecord {
        const instance = this.createInstance();
        for (const column of this.columns) {
            instance[column] = parameter[column];
        }
        return instance;
    }
}

//export class GenericSchema<TRow, TKey extends (keyof TRow)[]> implements RepositorySchema {
//    private readonly _factory: () => TRow;
//    private readonly _columns: (keyof TRow)[];
//    private readonly _keys: TKey;

//    private _primaryColumn: keyof TRow;
//    public get primaryColumn(): keyof TRow { return this._primaryColumn; }
//    public set primaryColumn(value: keyof TRow) { this._primaryColumn = value; }

//    public get keys() {
//        return this._keys;
//    }

//    public get columns() {
//        return this._columns;
//    }

//    public constructor(target: { new(): TRow }, keys: TKey) {
//        this._factory = () => new target();
//        this._columns = Object.keys(this._factory()) as (keyof TRow)[];
//        this._keys = keys;
//    }

//    public getKey(row: Required<TRow>): RowKey<TRow, TKey> {
//        return this.filter(row, this._keys);
//    }

//    protected filter(row: Required<TRow>, keys: TKey): RowKey<TRow, TKey> {
//        const ret = {} as Record<keyof TRow, any>;
//        for (const key of keys) {
//            ret[key] = row[key];
//        }
//        return ret as RowKey<TRow, TKey>;
//    }

//    public createRow(): TRow {
//        return this._factory();
//    }
//}
