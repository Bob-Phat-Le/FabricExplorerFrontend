export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string | null;
  operationId: string | null;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
}

export interface NotificationStreamEvent {
  unreadCount: number;
  notification: Notification | null;
}

export type NotificationFilter = 'all' | 'unread';
