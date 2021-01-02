import { RepositoryRow } from "./RepositoryRow";

export interface RepositorySchema<TRowKey, TRow extends TRowKey & RepositoryRow> {
    readonly keys: string[];
    readonly columns: string[];
    createRowKey(): TRowKey;
    createRow(): TRow;
}
