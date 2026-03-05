import { randomUUID } from 'crypto';
import type { NotificationMessageType, UserRole } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/app-error';

const APPLICATION_DOCUMENT_UPLOAD_FIELDS = [
  'internationalPassportUrl',
  'academicTranscriptsUrl',
  'degreeCertificatesUrl',
  'ieltsToeflCertificateUrl',
  'statementOfPurposeUrl',
  'curriculumVitaeUrl',
  'referenceLettersUrl',
  'portfolioUrl',
  'applicationFeeReceiptUrl',
  'proofOfFundsUrl'
] as const;

const REQUIRED_ACTION_MESSAGES = {
  verifyEmail:
    'Action Required: Please verify your email address to secure your account and continue receiving important updates on your application.',
  uploadDocuments:
    'Action Required: Please upload your required application documents so our team can review and process your submission without delay.',
  trackStudyApplication:
    'Action Required: Please open your application tracker to monitor each stage of your study application and stay informed about progress.'
} as const;

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

type CreateNotificationInput = {
  recipientUserId: string;
  senderUserId?: string | null;
  message: string;
  messageType: NotificationMessageType;
};

const mapNotification = (
  notification: {
    id: string;
    recipientUserId: string;
    senderUserId: string | null;
    message: string;
    messageType: NotificationMessageType;
    readAt: Date | null;
    createdAt: Date;
    senderUser: {
      id: string;
      fullName: string;
      email: string;
      profilePhotoUrl: string | null;
    } | null;
  }
): NotificationItem => ({
  id: notification.id,
  recipientUserId: notification.recipientUserId,
  senderUserId: notification.senderUserId,
  message: notification.message,
  messageType: notification.messageType,
  readAt: notification.readAt ? notification.readAt.toISOString() : null,
  createdAt: notification.createdAt.toISOString(),
  sender: notification.senderUser
    ? {
        id: notification.senderUser.id,
        fullName: notification.senderUser.fullName,
        email: notification.senderUser.email,
        profilePhotoUrl: notification.senderUser.profilePhotoUrl
      }
    : null
});

export const createNotification = async ({
  recipientUserId,
  senderUserId,
  message,
  messageType
}: CreateNotificationInput): Promise<NotificationItem> => {
  const sanitizedMessage = message.trim();

  if (!sanitizedMessage) {
    throw new AppError(400, 'Notification message is required');
  }

  const recipientUser = await prisma.user.findUnique({
    where: { id: recipientUserId },
    select: {
      id: true,
      role: true
    }
  });

  if (!recipientUser || recipientUser.role !== 'USER') {
    throw new AppError(404, 'Recipient user not found');
  }

  if (senderUserId) {
    const senderUser = await prisma.user.findUnique({
      where: { id: senderUserId },
      select: {
        id: true,
        role: true
      }
    });

    if (!senderUser) {
      throw new AppError(404, 'Sender user not found');
    }

    if (messageType === 'ADMIN_MESSAGE' && senderUser.role !== 'ADMIN') {
      throw new AppError(403, 'Only admins can send admin notifications');
    }
  }

  const createdNotification = await prisma.notification.create({
    data: {
      id: randomUUID(),
      recipientUserId,
      senderUserId: senderUserId ?? null,
      message: sanitizedMessage,
      messageType
    },
    include: {
      senderUser: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profilePhotoUrl: true
        }
      }
    }
  });

  return mapNotification(createdNotification);
};

export const getUserNotifications = async (userId: string, userRole: UserRole): Promise<NotificationItem[]> => {
  if (userRole !== 'USER') {
    throw new AppError(403, 'Only users can access this notification feed');
  }

  const notifications = await prisma.notification.findMany({
    where: {
      recipientUserId: userId
    },
    include: {
      senderUser: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profilePhotoUrl: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return notifications.map((notification) => mapNotification(notification));
};

export const getUnreadNotificationCount = async (userId: string, userRole: UserRole): Promise<number> => {
  if (userRole !== 'USER') {
    throw new AppError(403, 'Only users can access unread notification count');
  }

  return prisma.notification.count({
    where: {
      recipientUserId: userId,
      readAt: null
    }
  });
};

export const markAllNotificationsRead = async (userId: string, userRole: UserRole): Promise<void> => {
  if (userRole !== 'USER') {
    throw new AppError(403, 'Only users can mark notifications as read');
  }

  await prisma.notification.updateMany({
    where: {
      recipientUserId: userId,
      readAt: null
    },
    data: {
      readAt: new Date()
    }
  });
};

export const markNotificationRead = async (
  userId: string,
  userRole: UserRole,
  notificationId: string
): Promise<void> => {
  if (userRole !== 'USER') {
    throw new AppError(403, 'Only users can mark notifications as read');
  }

  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      recipientUserId: userId
    },
    select: {
      id: true,
      readAt: true
    }
  });

  if (!notification) {
    throw new AppError(404, 'Notification not found');
  }

  if (notification.readAt) {
    return;
  }

  await prisma.notification.update({
    where: {
      id: notificationId
    },
    data: {
      readAt: new Date()
    }
  });
};

export const ensureRequiredActionNotificationsForUser = async (userId: string): Promise<NotificationItem[]> => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
      id: true,
      role: true,
      emailVerifiedAt: true,
      applications: {
        select: {
          id: true,
          applicationType: true,
          hasViewedTracker: true,
          internationalPassportUrl: true,
          academicTranscriptsUrl: true,
          degreeCertificatesUrl: true,
          ieltsToeflCertificateUrl: true,
          statementOfPurposeUrl: true,
          curriculumVitaeUrl: true,
          referenceLettersUrl: true,
          portfolioUrl: true,
          applicationFeeReceiptUrl: true,
          proofOfFundsUrl: true
        }
      }
    }
  });

  if (!user || user.role !== 'USER') {
    return [];
  }

  if (user.applications.length === 0) {
    return [];
  }

  const hasUploadedAnyDocument = user.applications.some((application) =>
    APPLICATION_DOCUMENT_UPLOAD_FIELDS.some((field) => Boolean(application[field]))
  );

  const hasUntrackedStudyApplication = user.applications.some(
    (application) => application.applicationType === 'study_scholarship' && !application.hasViewedTracker
  );

  const candidateMessages: string[] = [];

  if (!user.emailVerifiedAt) {
    candidateMessages.push(REQUIRED_ACTION_MESSAGES.verifyEmail);
  }

  if (!hasUploadedAnyDocument) {
    candidateMessages.push(REQUIRED_ACTION_MESSAGES.uploadDocuments);
  }

  if (hasUntrackedStudyApplication) {
    candidateMessages.push(REQUIRED_ACTION_MESSAGES.trackStudyApplication);
  }

  if (candidateMessages.length === 0) {
    return [];
  }

  const existingSystemNotifications = await prisma.notification.findMany({
    where: {
      recipientUserId: userId,
      messageType: 'SYSTEM_MESSAGE',
      message: {
        in: candidateMessages
      }
    },
    select: {
      message: true
    }
  });

  const existingMessages = new Set(existingSystemNotifications.map((notification) => notification.message));
  const messagesToCreate = candidateMessages.filter((message) => !existingMessages.has(message));

  if (messagesToCreate.length === 0) {
    return [];
  }

  return Promise.all(
    messagesToCreate.map((message) =>
      createNotification({
        recipientUserId: userId,
        message,
        messageType: 'SYSTEM_MESSAGE'
      })
    )
  );
};
