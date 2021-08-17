import { RepositorySchema } from "./RepositorySchema";

export type SchemaKey<TSchema extends RepositorySchema> = ReturnType<TSchema['getKey']>;
export type SchemaRow<TSchema extends RepositorySchema> = Required<ReturnType<TSchema['createRow']>>;

export interface Repository<TSchema extends RepositorySchema> {
    find(key: SchemaKey<TSchema>): SchemaRow<TSchema>;
    findAll(keys: SchemaKey<TSchema>[]): SchemaRow<TSchema>[];
    update(rows: SchemaRow<TSchema> | SchemaRow<TSchema>[]): boolean;
}
