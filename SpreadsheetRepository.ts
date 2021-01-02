import { Repository, ReadOnlyRow } from "./RepositoryInterface";
import { RepositorySchema } from "./RepositorySchema";
import { RepositoryRow } from "./RepositoryRow";

export class SpreadsheetRepository<TRow extends TRowKey & RepositoryRow, TRowKey> implements Repository<TRow, TRowKey> {
    private _columnBind: { [key: string]: number } = null;
    private _rows: TRow[] = [];
    private _rowBind: { [key: string]: number } = {};

    private get columns(): string[] {
        return this._schema.columns;
    }

    public constructor(private readonly _sheet: GoogleAppsScript.Spreadsheet.Sheet, private readonly _schema: RepositorySchema<TRowKey, TRow>) { }

    public initialize(): void {
        this.reload();
    }

    public reload(): void {
        this._rows = [];
        this._rowBind = {};
        SpreadsheetApp.flush();
        const sheetDatas = this._sheet.getDataRange().getValues();
        if (!this._columnBind) {
            this._columnBind = {};
            const header = sheetDatas[0];
            for (let i = 0; i < header.length; i++) {
                this._columnBind[header[i]] = i;
            }
        }
        for (let i = 1; i < sheetDatas.length; i++) {
            const row = this._schema.createRow();
            for (let j = 0; j < this.columns.length; j++) {
                row[this.columns[j]] = sheetDatas[i][this._columnBind[this.columns[j]]];
            }
            const rowKey = this.createRowKey(sheetDatas[i]);
            const searchKey = this.createSearchKey(rowKey);
            const rowIndex = this._rows.push(row) - 1;
            this._rowBind[searchKey] = rowIndex;
        }
    }

    private createRowKey(record: any[]): TRowKey {
        const rowKey = this._schema.createRowKey();
        for (const key of this._schema.keys) {
            const index = this._columnBind[key];
            rowKey[key] = record[index];
        }
        return rowKey;
    }

    private createSearchKey(rowKey: TRowKey): string {
        let searchKey = "";
        for (const key of this._schema.keys) {
            if (searchKey) {
                searchKey += "," + rowKey[key];
            }
            else {
                searchKey = rowKey[key].toString();
            }
        }
        return searchKey;
    }

    public get rows(): ReadOnlyRow<TRow>[] {
        return this._rows.slice();
    }

    public find(key: TRowKey): ReadOnlyRow<TRow> {
        const searchKey = this.createSearchKey(key);
        const index = this._rowBind[searchKey];
        return this._rows[index];
    }

    public findAll(keys: TRowKey[]): ReadOnlyRow<TRow>[] {
        const ret: TRow[] = [];
        for (const key of keys) {
            const searchKey = this.createSearchKey(key);
            const index = this._rowBind[searchKey];
            ret.push(this._rows[index]);
        }
        return ret;
    }

    public update(rows: TRow | TRow[]): boolean {
        if (!Array.isArray(rows)) {
            rows = [rows];
        }

        const oldRows = this.rows;
        const oldRowBind = this._rowBind;

        // TODO: ロックを掛ける
        this.reload();

        const addedRows: TRow[] = [];
        const updatedRows: { key: string; row: TRow }[] = [];
        for (const row of rows) {
            const key = this.createSearchKey(row);
            if (key in this._rowBind) {
                updatedRows.push({ key: key, row: row });
            }
            else {
                addedRows.push(row);
            }
        }

        if (updatedRows.length > 0) {
            for (const updated of updatedRows) {
                if (updated.key in oldRowBind) {
                    const oldRow = oldRows[oldRowBind[updated.key]];
                    const currentRow = this._rows[this._rowBind[updated.key]];
                    if (currentRow.updatedAt.getTime() > oldRow.updatedAt.getTime()) {
                        return false;
                    }
                }
                else {
                    return false;
                }
            }
        }

        let minRowIndex = -1;
        let maxRowIndex = -1;
        for (const updated of updatedRows) {
            updated.row.rowId = this._rows[this._rowBind[updated.key]].rowId;
            updated.row.createdAt = this._rows[this._rowBind[updated.key]].createdAt;
            updated.row.updatedAt = new Date();
            this._rows[this._rowBind[updated.key]] = updated.row;

            if (minRowIndex < 0 || minRowIndex > this._rowBind[updated.key]) {
                minRowIndex = this._rowBind[updated.key];
            }
            if (maxRowIndex < 0 || maxRowIndex < this._rowBind[updated.key]) {
                maxRowIndex = this._rowBind[updated.key];
            }
        }
        if (addedRows.length > 0) {
            for (const added of addedRows) {
                added.rowId = this._rows.length + 1;
                const searchKey = this.createSearchKey(added);
                const rowIndex = this._rows.push(added) - 1;
                this._rowBind[searchKey] = rowIndex;

                if (minRowIndex < 0 || minRowIndex > rowIndex) {
                    minRowIndex = rowIndex;
                }
                if (maxRowIndex < 0 || maxRowIndex < rowIndex) {
                    maxRowIndex = rowIndex;
                }
            }
        }

        if (minRowIndex >= 0 && maxRowIndex >= 0) {
            const rawObjects: any[][] = [];
            for (let i = minRowIndex; i <= maxRowIndex; i++) {
                const obj = this.toRawObject(this._rows[i]);
                rawObjects.push(obj);
            }

            this._sheet.getRange(minRowIndex + 2, 1, maxRowIndex - minRowIndex + 1, this.columns.length).setValues(rawObjects);
        }

        return true;
    }

    private toRawObject(row: TRow): any[] {
        const ret: any[] = new Array(this.columns.length);
        for (const column of this.columns) {
            ret[this._columnBind[column]] = row[column];
        }
        return ret;
    }
}
