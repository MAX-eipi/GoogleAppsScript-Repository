import { RepositorySchema, RowKey } from "./RepositorySchema";

export class GenericSchema<TRow, TKey extends (keyof TRow)[]> implements RepositorySchema {
    private readonly _columns: (keyof TRow)[];
    private readonly _defaultValue: TRow;
    private readonly _keys: TKey;

    public get keys() {
        return this._keys;
    }

    public get columns() {
        return this._columns;
    }

    public constructor(target: { new(): TRow }, keys: TKey) {
        this._defaultValue = new target();
        this._columns = Object.keys(this._defaultValue) as (keyof TRow)[];
        this._keys = keys;
    }

    public getKey(row: Required<TRow>): RowKey<TRow, TKey> {
        return this.filter(row, this._keys);
    }

    protected filter(row: Required<TRow>, keys: TKey): RowKey<TRow, TKey> {
        const ret = {} as Record<keyof TRow, any>;
        for (const key of keys) {
            ret[key] = row[key];
        }
        return ret as RowKey<TRow, TKey>;
    }

    public createRow(): Required<TRow> {
        const ret = {} as Record<keyof TRow, any>;
        for (const column of this._columns) {
            ret[column] = this._defaultValue[column];
        }
        return ret as Required<TRow>;
    }
}
