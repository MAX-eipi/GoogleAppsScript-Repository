class SpreadsheetDatabaseTable<TRecord, TRecordKey extends keyof TRecord> implements DatabaseTable<TRecord, TRecordKey> {
    private _columns: (keyof SpreadsheetRecord<TRecord>)[];
    private _columnBind: Record<keyof SpreadsheetRecord<TRecord>, number>;
    private _records: SpreadsheetRecord<TRecord>[];
    private _recordBind: Record<string, number>;

    public get schema(): DatabaseSchema<TRecord, TRecordKey> { return this._schema; }

    public constructor(
        private readonly _schema: DatabaseSchema<TRecord, TRecordKey>,
        private readonly _sheet: GoogleAppsScript.Spreadsheet.Sheet) {
        this.initialize();
    }

    private initialize(): void {
        const sheetDatas = this._sheet.getDataRange().getValues();
        this.initializeColumn(sheetDatas);
        this.initializeRecord(sheetDatas);
    }

    private initializeColumn(sheetDatas: unknown[][]): void {
        this._columns = this._schema.columns.slice();
        const header = sheetDatas[0];
        if (this._columns.indexOf('createdAt') === -1 && header.indexOf('createdAt') !== -1) {
            this._columns.push('createdAt');
        }
        if (this._columns.indexOf('updatedAt') === -1 && header.indexOf('updatedAt') !== -1) {
            this._columns.push('updatedAt');
        }

        this._columnBind = {} as Record<keyof SpreadsheetRecord<TRecord>, number>;
        for (let i = 0; i < header.length; i++) {
            this._columnBind[header[i] as keyof SpreadsheetRecord<TRecord>] = i;
        }
    }

    private initializeRecord(sheetDatas: unknown[][]): void {
        this._records = [];
        this._recordBind = {};
        for (let i = 1; i < sheetDatas.length; i++) {
            const record = this._schema.instantiateRecord() as SpreadsheetRecord<TRecord>;
            for (let j = 0; j < this._columns.length; j++) {
                record[this._columns[j] as string] = sheetDatas[i][this._columnBind[this._columns[j]]];
            }
            const recordKey = this.createRecordKey(sheetDatas[i]);
            const searchKey = this.createSearchKey(recordKey);
            const recordIndex = this._records.push(record) - 1;
            this._recordBind[searchKey] = recordIndex;
        }
    }

    private createRecordKey(record: unknown[]): Pick<TRecord, TRecordKey> {
        const recordKey = {} as Record<TRecordKey, unknown>;
        for (const keyColumn of this._schema.keyColumns) {
            const index = this._columnBind[keyColumn];
            recordKey[keyColumn] = record[index];
        }
        return recordKey as Pick<TRecord, TRecordKey>;
    }

    public get records(): TRecord[] {
        return this._records.slice();
    }

    public find(key: Pick<TRecord, TRecordKey>): TRecord {
        const searchKey = this.createSearchKey(key);
        const index = this._recordBind[searchKey];
        return this._records[index];
    }

    public findAll(keys: Pick<TRecord, TRecordKey> | Pick<TRecord, TRecordKey>[]): TRecord[] {
        if (!Array.isArray(keys)) {
            keys = [keys];
        }
        const records: TRecord[] = [];
        for (const key of keys) {
            const searchKey = this.createSearchKey(key);
            const index = this._recordBind[searchKey];
            records.push(this._records[index]);
        }
        return records;
    }

    public update(records: Required<TRecord> | Required<TRecord>[]) {
        if (!Array.isArray(records)) {
            records = [records];
        }

        const convertedRecords = records.map(r => this.convertRow(r));
        const addedRecords: SpreadsheetRecord<TRecord>[] = [];
        const updatedRecords: { key: string; record: SpreadsheetRecord<TRecord> }[] = [];
        for (const row of convertedRecords) {
            const key = this.createSearchKey(row);
            if (key in this._recordBind) {
                updatedRecords.push({ key: key, record: row });
            }
            else {
                addedRecords.push(row);
            }
        }

        let minRowIndex = -1;
        let maxRowIndex = -1;
        for (const updated of updatedRecords) {
            updated.record.createdAt = this._records[this._recordBind[updated.key]].createdAt;
            updated.record.updatedAt = new Date();
            this._records[this._recordBind[updated.key]] = updated.record;

            if (minRowIndex < 0 || minRowIndex > this._recordBind[updated.key]) {
                minRowIndex = this._recordBind[updated.key];
            }
            if (maxRowIndex < 0 || maxRowIndex < this._recordBind[updated.key]) {
                maxRowIndex = this._recordBind[updated.key];
            }
        }
        if (addedRecords.length > 0) {
            for (const added of addedRecords) {
                const primaryColumn = this._schema.primaryColumn as string;
                if (primaryColumn) {
                    added[primaryColumn] = this._records.length + 1;
                }
                added.createdAt = new Date();
                added.updatedAt = new Date();
                const searchKey = this.createSearchKey(added);
                const rowIndex = this._records.push(added) - 1;
                this._recordBind[searchKey] = rowIndex;

                if (minRowIndex < 0 || minRowIndex > rowIndex) {
                    minRowIndex = rowIndex;
                }
                if (maxRowIndex < 0 || maxRowIndex < rowIndex) {
                    maxRowIndex = rowIndex;
                }
            }
        }

        if (minRowIndex >= 0 && maxRowIndex >= 0) {
            const rawObjects: unknown[][] = [];
            for (let i = minRowIndex; i <= maxRowIndex; i++) {
                const obj = this.toRawObject(this._records[i]);
                rawObjects.push(obj);
            }

            this._sheet.getRange(minRowIndex + 2, 1, maxRowIndex - minRowIndex + 1, this._columns.length).setValues(rawObjects);
        }

        return {
            added: addedRecords as TRecord[],
            updated: updatedRecords.map(x => x.record) as TRecord[],
        };
    }

    private createSearchKey(recordKey: Pick<TRecord, TRecordKey>): string {
        let searchKey = "";
        for (const keyColumn of this._schema.keyColumns) {
            if (searchKey) {
                searchKey += "," + recordKey[keyColumn];
            }
            else {
                searchKey = recordKey[keyColumn].toString();
            }
        }
        return searchKey;
    }

    private convertRow(record: Required<TRecord>): SpreadsheetRecord<TRecord> {
        const obj = this._schema.instantiateRecordByParameter(record) as SpreadsheetRecord<TRecord>;
        if (obj.createdAt === null) {
            obj.createdAt = null;
        }
        if (obj.updatedAt === null) {
            obj.updatedAt = null;
        }
        return obj;
    }

    private toRawObject(row: SpreadsheetRecord<TRecord>): unknown[] {
        const ret: unknown[] = new Array(this._columns.length);
        for (const column of this._columns) {
            ret[this._columnBind[column]] = typeof row[column] === 'string' ? `'${row[column]}` : row[column];
        }
        return ret;
    }

}
