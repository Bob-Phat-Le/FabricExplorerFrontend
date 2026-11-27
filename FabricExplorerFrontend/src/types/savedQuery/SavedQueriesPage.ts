import type { SavedQuery } from './SavedQuery';

export interface SavedQueriesPage {
  items: SavedQuery[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}
