export interface CatalogTableItem {
  name: string;
  schema: string;
  type: string | null;
  format: string | null;
  /** null when the backend list response doesn't include columns */
  columnCount: number | null;
}

export interface CatalogSchema {
  name: string;
  tables: CatalogTableItem[];
}

export interface CatalogTree {
  lakehouseId: string;
  totalTables: number;
  schemas: CatalogSchema[];
}

export interface CatalogColumn {
  name: string;
  type: string;
  position: number;
  nullable: boolean;
  description: string | null;
}

export interface CatalogTableDetail {
  schema: string;
  name: string;
  fullName: string;
  description: string | null;
  type: string | null;
  format: string | null;
  location: string | null;
  columns: CatalogColumn[];
}

export interface CatalogTarget {
  connectionId: string;
  workspaceId: string;
  lakehouseId: string;
}

export interface CatalogTableRef {
  schema: string;
  table: string;
}
