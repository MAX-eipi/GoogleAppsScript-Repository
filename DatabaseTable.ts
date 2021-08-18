import { DatabaseTableSchema } from "./DatabaseTableSchema";

//export type SchemaKey<TSchema extends RepositorySchema> = ReturnType<TSchema['getKey']>;
//export type SchemaRow<TSchema extends RepositorySchema> = Required<ReturnType<TSchema['createRow']>>;

//export interface Repository<TSchema extends RepositorySchema> {
//    find(key: SchemaKey<TSchema>): SchemaRow<TSchema>;
//    findAll(keys: SchemaKey<TSchema>[]): SchemaRow<TSchema>[];
//    update(rows: SchemaRow<TSchema> | SchemaRow<TSchema>[]);
//}

export interface DatabaseTable<TRow, TRowKey extends keyof TRow> {
    readonly schema: DatabaseTableSchema<TRow, TRowKey>;

    find(key: TRowKey): TRow;
    findAll(keys: TRowKey | TRowKey[]): TRow[];
    update(rows: Required<TRow>): { added: TRow[]; updated: TRow[] };
}
