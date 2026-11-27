/** Query string of `GET /saved-queries`. */
export interface SavedQueriesQuery {
  page: number;
  pageSize: number;
  search?: string;
  /** Only the queries saved for this connection. */
  connectionId?: string;
  itemType?: string;
}
