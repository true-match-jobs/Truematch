import { api } from './api';

export type NotificationMessageType = 'SYSTEM_MESSAGE' | 'ADMIN_MESSAGE';

export type NotificationSender = {
  id: string;
  fullName: string;
  email: string;
  profilePhotoUrl: string | null;
} | null;

export type NotificationItem = {
  id: string;
  recipientUserId: string;
  senderUserId: string | null;
  message: string;
  messageType: NotificationMessageType;
  readAt: string | null;
  createdAt: string;
  sender: NotificationSender;
};

type UserNotificationsResponse = {
  notifications: NotificationItem[];
};

type NotificationUnreadCountResponse = {
  count: number;
};

type SendAdminNotificationResponse = {
  message: string;
  notification: NotificationItem;
};

export const notificationService = {
  async getMine(): Promise<NotificationItem[]> {
    const response = await api.get<UserNotificationsResponse>('/users/me/notifications');
    return response.data.notifications;
  },

  async sendToUser(userId: string, message: string): Promise<NotificationItem> {
    const response = await api.post<SendAdminNotificationResponse>(`/admin/users/${userId}/notifications`, {
      message
    });

    return response.data.notification;
  },

  async getMyUnreadCount(): Promise<number> {
    const response = await api.get<NotificationUnreadCountResponse>('/users/me/notifications/unread-count');
    return response.data.count;
  },

  async markAllRead(): Promise<void> {
    await api.patch('/users/me/notifications/read-all');
  },

  async clearAll(): Promise<void> {
    await api.delete('/users/me/notifications');
  },

  async markRead(notificationId: string): Promise<void> {
    await api.patch(`/users/me/notifications/${notificationId}/read`);
  }
};
