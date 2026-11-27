import type { QueryTargetItem } from './QueryTargetItem';

/** What the Query Editor currently holds and what "Save Query" would store. */
export interface QueryDraft {
  sql: string;
  /** null = unlimited */
  maxRows: number | null;
  target: QueryTargetItem | null;
}
