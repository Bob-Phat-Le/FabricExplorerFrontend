/** Max Row choices of the editor ("Unlimited" is added by the select and means `null`). */
export const MAX_ROWS_OPTIONS = [100, 500, 1000, 5000, 10000] as const;
export const DEFAULT_MAX_ROWS = 100;

export const SAVED_QUERY_NAME_MAX = 200;
export const SAVED_QUERY_DESCRIPTION_MAX = 1000;
export const SAVED_QUERY_LANGUAGE = 'tsql';

export const SAVED_QUERIES_PAGE_SIZE = 8;
export const SEARCH_DEBOUNCE_MS = 300;

/** Error codes of `/api/saved-queries` the UI reacts to. */
export const SAVED_QUERY_ERROR = {
  duplicated: 'saved_query.duplicated',
} as const;
