import type { SavedQueryTarget } from './SavedQueryTarget';

/**
 * Body of `PATCH /saved-queries/{id}`. Only the fields that are sent are changed:
 * an empty `description` clears it, `unlimitedRows` clears `maxRows`.
 */
export interface UpdateSavedQueryPayload {
  name?: string;
  description?: string;
  target?: SavedQueryTarget;
  sql?: string;
  maxRows?: number;
  unlimitedRows?: boolean;
}
