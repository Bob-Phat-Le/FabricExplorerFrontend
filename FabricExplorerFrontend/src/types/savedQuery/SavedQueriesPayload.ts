import type { SavedQuery } from './SavedQuery';

/** `data` of `GET /saved-queries`: a page of items (or, from older mocks, a bare list). */
export interface SavedQueriesPayload {
  items?: SavedQuery[];
  pageInformation?: { page?: number; pageSize?: number; totalPages?: number; totalItems?: number };
}
