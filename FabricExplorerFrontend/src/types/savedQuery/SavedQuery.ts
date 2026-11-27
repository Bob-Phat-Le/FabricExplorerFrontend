import type { SavedQueryTarget } from './SavedQueryTarget';

/** A query saved from the Query Editor. Mirrors `SavedQueryResponse` of `/api/saved-queries`. */
export interface SavedQuery {
  id: string;
  /** Stable key used by import/export to match entries between environments. */
  externalKey: string;
  name: string;
  description: string | null;
  connectionId: string;
  connectionName: string | null;
  target: SavedQueryTarget;
  language: string;
  sql: string;
  /** null = unlimited */
  maxRows: number | null;
  createdAt: string;
  updatedAt: string | null;
}
