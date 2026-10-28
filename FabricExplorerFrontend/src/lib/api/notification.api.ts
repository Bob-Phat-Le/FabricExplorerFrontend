import { call } from './client';
import { mocks } from '../mocks/handlers';
import type { Notification } from '@/types/notification';

const BasePath = '/notifications';

const unwrap = <T>(r: unknown): T =>
  (r && typeof r === 'object' && !Array.isArray(r) && 'data' in r ? (r as { data: T }).data : r) as T;

export interface ListNotificationsParams {
  skip?: number;
  take?: number;
  unreadOnly?: boolean;
}

/** GET /notifications?skip=&take=&unreadOnly= -> Notification[] (mới nhất trước, không có tổng số). */
export const list = ({ skip = 0, take = 50, unreadOnly = false }: ListNotificationsParams = {}) =>
  call<unknown>(
    { method: 'GET', path: BasePath, query: { skip, take, unreadOnly: unreadOnly || undefined } },
    mocks.notifications.list,
  ).then((r) => unwrap<Notification[] | null>(r) ?? []);

/** GET /notifications/unread-count -> number */
export const getUnreadCount = () =>
  call<unknown>({ method: 'GET', path: `${BasePath}/unread-count` }, mocks.notifications.unreadCount).then(
    (r) => unwrap<number | null>(r) ?? 0,
  );

/** POST /notifications/:id/read -> Notification (đã cập nhật) */
export const markAsRead = (id: string) =>
  call<unknown>(
    { method: 'POST', path: `${BasePath}/${encodeURIComponent(id)}/read` },
    mocks.notifications.markAsRead,
  ).then((r) => unwrap<Notification>(r));

/** POST /notifications/read-all -> { message } */
export const markAllAsRead = () =>
  call<unknown>({ method: 'POST', path: `${BasePath}/read-all` }, mocks.notifications.markAllAsRead).then((r) =>
    unwrap<{ message: string }>(r),
  );
