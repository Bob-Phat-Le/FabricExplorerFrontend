import type { CatalogColumn } from '@/types/catalog';

const MAX_LISTED_COLUMNS = 30;

/** T-SQL identifier quoting: [name] with ] escaped as ]]. */
export const quoteIdentifier = (id: string) => `[${id.replace(/]/g, ']]')}]`;

export const qualifiedName = (schema: string, table: string) => `${quoteIdentifier(schema)}.${quoteIdentifier(table)}`;

/** Sample query for the lakehouse SQL analytics endpoint. */
export function buildSampleQuery(schema: string, table: string, columns: CatalogColumn[], limit = 100): string {
  const select =
    columns.length === 0 || columns.length > MAX_LISTED_COLUMNS
      ? '*'
      : `\n${columns.map((c) => `    ${quoteIdentifier(c.name)}`).join(',\n')}\n`;

  return `SELECT TOP ${limit} ${select}FROM ${qualifiedName(schema, table)};\n`;
}
