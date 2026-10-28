import { call, ApiError } from './client';
import { mocks } from '../mocks/handlers';
import type { Connection, ConnectionPayload, ConnectionsPage, ConnectionTestPayload } from '@/types/connection';

const BasePath = '/connections';

const unwrap = <T>(r: unknown): T =>
  (r && typeof r === 'object' && !Array.isArray(r) && 'data' in r ? (r as { data: T }).data : r) as T;

const toList = (r: unknown): Connection[] => {
  const d = unwrap<Connection[] | { items?: Connection[] } | null>(r);
  return Array.isArray(d) ? d : (d?.items ?? []);
};

export const list = () => call<unknown>({ method: 'GET', path: BasePath }, mocks.connections.list).then(toList);

export const get = (id: string) =>
  call<unknown>({ method: 'GET', path: `${BasePath}/${id}` }, mocks.connections.get).then((r) => unwrap<Connection>(r));

export const getActive = () =>
  call<unknown>({ method: 'GET', path: `${BasePath}/active` }, mocks.connections.getActive)
    .then((r) => unwrap<Connection | null>(r) ?? null)
    .catch((err) => {
      if (err instanceof ApiError && err.status === 404) return null;
      throw err;
    });

export const save = (payload: ConnectionPayload) =>
  call<unknown>({ method: 'POST', path: BasePath, body: payload }, mocks.connections.save).then((r) => unwrap<Connection>(r));

export const update = (id: string, payload: ConnectionPayload) =>
  call<unknown>({ method: 'PATCH', path: `${BasePath}/${id}`, body: payload }, mocks.connections.update).then((r) =>
    unwrap<Connection>(r),
  );

export const test = (payload: ConnectionTestPayload) =>
  call<unknown>({ method: 'POST', path: `${BasePath}/test`, body: payload }, mocks.ok);

export const testSaved = (id: string) => call<unknown>({ method: 'POST', path: `${BasePath}/${id}/test` }, mocks.ok);

export const activate = (id: string) =>
  call<unknown>({ method: 'POST', path: `${BasePath}/${id}/active` }, mocks.connections.activate);

interface PagedPayload {
  items?: Connection[];
  pageInformation?: { page?: number; pageSize?: number; totalPages?: number; totalItems?: number };
}

export const listPage = ({ page, pageSize }: { page: number; pageSize: number }): Promise<ConnectionsPage> =>
  call<unknown>({ method: 'GET', path: BasePath, query: { page, pageSize } }, mocks.connections.list).then((r) => {
    const d = unwrap<Connection[] | PagedPayload | null>(r);

    if (Array.isArray(d)) {
      const start = (page - 1) * pageSize;
      return {
        items: d.slice(start, start + pageSize),
        page,
        pageSize,
        totalItems: d.length,
        totalPages: Math.max(1, Math.ceil(d.length / pageSize)),
      };
    }

    const items = d?.items ?? [];
    const pi = d?.pageInformation ?? {};
    const size = pi.pageSize ?? pageSize;
    const totalItems = pi.totalItems ?? items.length;
    return {
      items,
      page: pi.page ?? page,
      pageSize: size,
      totalItems,
      totalPages: pi.totalPages ?? Math.max(1, Math.ceil(totalItems / size)),
    };
  });
