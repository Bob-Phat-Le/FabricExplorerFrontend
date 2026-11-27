import { call } from './client';
import { mocks } from '../mocks/handlers';
import type { CreateSavedQueryPayload } from '@/types/savedQuery/CreateSavedQueryPayload';
import type { SavedQueriesPage } from '@/types/savedQuery/SavedQueriesPage';
import type { SavedQueriesPayload } from '@/types/savedQuery/SavedQueriesPayload';
import type { SavedQueriesQuery } from '@/types/savedQuery/SavedQueriesQuery';
import type { SavedQuery } from '@/types/savedQuery/SavedQuery';
import type { UpdateSavedQueryPayload } from '@/types/savedQuery/UpdateSavedQueryPayload';

const BASE = '/saved-queries';

const unwrap = <T>(r: unknown): T =>
  (r && typeof r === 'object' && !Array.isArray(r) && 'data' in r ? (r as { data: T }).data : r) as T;

/** Saved queries of the signed-in user, filtered and paged on the server. */
export const list = (query: SavedQueriesQuery, { signal }: { signal?: AbortSignal } = {}): Promise<SavedQueriesPage> =>
  call<unknown>(
    {
      method: 'GET',
      path: BASE,
      query: {
        page: query.page,
        pageSize: query.pageSize,
        search: query.search?.trim(),
        connectionId: query.connectionId,
        itemType: query.itemType,
      },
      signal,
    },
    mocks.savedQueries.list,
  ).then((r) => {
    const d = unwrap<SavedQuery[] | SavedQueriesPayload | null>(r);
    const items = Array.isArray(d) ? d : (d?.items ?? []);
    const info = (Array.isArray(d) ? null : d?.pageInformation) ?? {};
    const pageSize = info.pageSize ?? query.pageSize;
    const totalItems = info.totalItems ?? items.length;
    return {
      items,
      page: info.page ?? query.page,
      pageSize,
      totalItems,
      totalPages: info.totalPages ?? Math.max(1, Math.ceil(totalItems / pageSize)),
    };
  });

export const get = (id: string) =>
  call<unknown>({ method: 'GET', path: `${BASE}/${id}` }, mocks.savedQueries.get).then((r) => unwrap<SavedQuery>(r));

export const create = (payload: CreateSavedQueryPayload) =>
  call<unknown>({ method: 'POST', path: BASE, body: payload }, mocks.savedQueries.create).then((r) => unwrap<SavedQuery>(r));

export const update = (id: string, payload: UpdateSavedQueryPayload) =>
  call<unknown>({ method: 'PATCH', path: `${BASE}/${id}`, body: payload }, mocks.savedQueries.update).then((r) =>
    unwrap<SavedQuery>(r),
  );

export const remove = (id: string) => call<unknown>({ method: 'DELETE', path: `${BASE}/${id}` }, mocks.savedQueries.remove);
