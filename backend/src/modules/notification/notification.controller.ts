import type { Request, Response } from 'express';
import { AppError } from '../../utils/app-error';
import { pushNotificationToUser } from '../chat/websocket';
import {
  createNotification,
  ensureRequiredActionNotificationsForUser,
  getUnreadNotificationCount,
  getUserNotifications,
  markAllNotificationsRead,
  markNotificationRead
} from './notification.service';

export const getMyNotificationsHandler = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError(401, 'Unauthorized');
  }

  const createdSystemNotifications = await ensureRequiredActionNotificationsForUser(req.user.userId);

  createdSystemNotifications.forEach((notification) => {
    pushNotificationToUser(req.user!.userId, {
      type: 'notification',
      notification
    });
  });

  const notifications = await getUserNotifications(req.user.userId, req.user.role);

  res.status(200).json({ notifications });
};

export const sendNotificationToUserByAdminHandler = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError(401, 'Unauthorized');
  }

  if (req.user.role !== 'ADMIN') {
    throw new AppError(403, 'Forbidden');
  }

  const recipientUserId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  if (!recipientUserId) {
    throw new AppError(400, 'Recipient user id is required');
  }

  const rawMessage = req.body?.message;

  if (typeof rawMessage !== 'string' || !rawMessage.trim()) {
    throw new AppError(400, 'Message is required');
  }

  const notification = await createNotification({
    recipientUserId,
    senderUserId: req.user.userId,
    message: rawMessage,
    messageType: 'ADMIN_MESSAGE'
  });

  pushNotificationToUser(recipientUserId, {
    type: 'notification',
    notification
  });

  res.status(201).json({
    message: 'Notification sent successfully',
    notification
  });
};

export const getMyUnreadNotificationCountHandler = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError(401, 'Unauthorized');
  }

  const createdSystemNotifications = await ensureRequiredActionNotificationsForUser(req.user.userId);

  createdSystemNotifications.forEach((notification) => {
    pushNotificationToUser(req.user!.userId, {
      type: 'notification',
      notification
    });
  });

  const count = await getUnreadNotificationCount(req.user.userId, req.user.role);

  res.status(200).json({ count });
};

export const markMyNotificationsReadHandler = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError(401, 'Unauthorized');
  }

  await markAllNotificationsRead(req.user.userId, req.user.role);

  res.status(200).json({ message: 'Notifications marked as read' });
};

export const markMyNotificationReadHandler = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError(401, 'Unauthorized');
  }

  const notificationId = Array.isArray(req.params.notificationId)
    ? req.params.notificationId[0]
    : req.params.notificationId;

  if (!notificationId) {
    throw new AppError(400, 'Notification id is required');
  }

  await markNotificationRead(req.user.userId, req.user.role, notificationId);

  res.status(200).json({ message: 'Notification marked as read' });
};
