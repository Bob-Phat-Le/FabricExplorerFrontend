/**
 * Hand-off between Catalog → Tables and Catalog → Query Editor.
 * sessionStorage keeps it across the client-side navigation without a global provider,
 * and a sample is consumed once so a page reload doesn't overwrite what the user typed.
 */
const KEY = 'fabric-explorer:query-sample';

export interface QuerySample {
  sql: string;
  /** e.g. "dbo.Customers", shown as a toast by the editor */
  label: string;
}

export function saveQuerySample(sample: QuerySample) {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(sample));
  } catch {
    /* storage unavailable (private mode / quota): the editor just opens with its default query */
  }
}

export function consumeQuerySample(): QuerySample | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(KEY);
    const parsed = JSON.parse(raw) as Partial<QuerySample>;
    return typeof parsed.sql === 'string' ? { sql: parsed.sql, label: parsed.label ?? '' } : null;
  } catch {
    return null;
  }
}
