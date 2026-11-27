import type { SavedQueryTarget } from './SavedQueryTarget';

/** Body of `POST /saved-queries`. */
export interface CreateSavedQueryPayload {
  name: string;
  description: string | null;
  connectionId: string;
  target: SavedQueryTarget;
  language: string;
  sql: string;
  /** null = unlimited */
  maxRows: number | null;
}
