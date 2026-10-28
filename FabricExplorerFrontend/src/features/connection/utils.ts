import type { Connection } from '@/types/connection';
import { CONN_PAGE_SIZE_DEFAULT, CONN_PAGE_SIZE_MAX } from './constants';

export const TOKEN_PATH_RE = /^\/([^/]+)\/oauth2\/(?:v2\.0\/)?token\/?$/i;

export const tokenEndpointOf = (conn: Connection | null | undefined): string =>
  conn?.tokenEndpoint || (conn?.tenantId ? `https://login.microsoftonline.com/${conn.tenantId}/oauth2/v2.0/token` : '');

export function clampPageSize(raw: string | number): number {
  const n = parseInt(String(raw), 10);
  if (!Number.isFinite(n) || n < 1) return CONN_PAGE_SIZE_DEFAULT;
  return Math.min(n, CONN_PAGE_SIZE_MAX);
}

/** Cửa sổ `size` số trang quanh trang hiện tại. */
export function pageWindow(current: number, total: number, size = 5): number[] {
  let start = Math.max(1, current - Math.floor(size / 2));
  const end = Math.min(total, start + size - 1);
  start = Math.max(1, end - size + 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}
