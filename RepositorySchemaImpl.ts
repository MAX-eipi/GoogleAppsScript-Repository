import { RepositorySchema } from "./RepositorySchema";
import { RepositoryRow } from "./RepositoryRow";

export class RepositorySchemaImpl<TRow extends TRowKey & RepositoryRow, TRowKey> implements RepositorySchema<TRowKey, TRow> {
    public readonly keys: string[] = Object.keys(this.createRowKey());
    public readonly columns: string[] = Object.keys(this.createRow());

    public constructor(
        private readonly _rowFactory: () => TRow,
        private readonly _rowKeyFactory: () => TRowKey
    ) {
    }

    public createRowKey(): TRowKey {
        return this._rowKeyFactory();
    }
    public createRow(): TRow {
        return this._rowFactory();
    }
}
