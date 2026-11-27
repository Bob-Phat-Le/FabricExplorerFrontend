/** Flat row of the in-memory saved-query store (shared by the Query Editor and Import/Export mocks). */
export interface MockSavedQuery {
  id: string;
  key: string;
  name: string;
  description: string | null;
  connectionId: string;
  itemType: string;
  itemId: string;
  itemName: string;
  sql: string;
  maxRows: number | null;
  createdAt: string;
  updatedAt: string | null;
}
