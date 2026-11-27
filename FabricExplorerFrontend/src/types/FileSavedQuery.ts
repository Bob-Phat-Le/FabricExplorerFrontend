/** A saved query as it appears in a configuration file (`savedQueries[]`). Everything is optional: the file is untrusted. */
export interface FileSavedQuery {
  key?: string;
  name?: string;
  description?: string | null;
  connectionKey?: string;
  target?: { itemType?: string; itemId?: string; itemName?: string } | null;
  language?: string;
  sql?: string;
  /** null = unlimited */
  maxRows?: number | null;
  [k: string]: unknown;
}
