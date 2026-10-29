import { call } from './client';
import { mocks } from '../mocks/handlers';
import type { CatalogTableDetail, CatalogTarget, CatalogTableRef, CatalogTree } from '@/types/catalog';

interface Opts {
  refresh?: boolean;
  signal?: AbortSignal;
}

const unwrap = <T>(r: unknown): T =>
  (r && typeof r === 'object' && 'statusCode' in r && 'data' in r ? (r as { data: T }).data : r) as T;

const base = ({ workspaceId, lakehouseId }: Pick<CatalogTarget, 'workspaceId' | 'lakehouseId'>) =>
  `/workspaces/${workspaceId}/lakehouses/${lakehouseId}/catalog`;

const requestOpts = ({ connectionId }: CatalogTarget, { refresh = false, signal }: Opts) => ({
  headers: { 'X-Connection-Id': connectionId, ...(refresh ? { 'Cache-Control': 'no-cache' } : {}) },
  signal,
});

/** Schemas of the lakehouse, each with the tables it contains. */
export const getCatalogTree = (target: CatalogTarget, opts: Opts = {}) =>
  call<unknown>({ method: 'GET', path: base(target), ...requestOpts(target, opts) }, mocks.catalog.tree).then(
    (r) => unwrap<CatalogTree>(r),
  );

/** Columns (with descriptions when OneLake has them) of a single table. */
export const getCatalogTable = (target: CatalogTarget, { schema, table }: CatalogTableRef, opts: Opts = {}) =>
  call<unknown>(
    {
      method: 'GET',
      path: `${base(target)}/schemas/${encodeURIComponent(schema)}/tables/${encodeURIComponent(table)}`,
      ...requestOpts(target, opts),
      meta: { schema, table },
    },
    mocks.catalog.table,
  ).then((r) => unwrap<CatalogTableDetail>(r));
