/** Khớp NotificationResponse của backend. */
export interface Notification {
  id: string;
  userId: string;
  /** vd: "connection.created.succeeded", "operation.failed" */
  type: string;
  title: string;
  message: string | null;
  operationId: string | null;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
}

/** Payload của SSE `unread-count` (notification = null) và `notification`. */
export interface NotificationStreamEvent {
  unreadCount: number;
  notification: Notification | null;
}

export type NotificationFilter = 'all' | 'unread';
