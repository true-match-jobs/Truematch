import { randomUUID } from 'crypto';
import { Prisma, type NotificationMessageType, type UserRole } from '@prisma/client';
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
): NotificationItem => {
  // Treat legacy admin-authored notifications as system messages in API responses.
  // This keeps historical records consistent with the current product behavior.
  const normalizedMessageType = notification.messageType === 'ADMIN_MESSAGE' ? 'SYSTEM_MESSAGE' : notification.messageType;

  return {
    id: notification.id,
    recipientUserId: notification.recipientUserId,
    senderUserId: normalizedMessageType === 'SYSTEM_MESSAGE' ? null : notification.senderUserId,
    message: notification.message,
    messageType: normalizedMessageType,
    readAt: notification.readAt ? notification.readAt.toISOString() : null,
    createdAt: notification.createdAt.toISOString(),
    sender:
      normalizedMessageType === 'SYSTEM_MESSAGE'
        ? null
        : notification.senderUser
          ? {
              id: notification.senderUser.id,
              fullName: notification.senderUser.fullName,
              email: notification.senderUser.email,
              profilePhotoUrl: notification.senderUser.profilePhotoUrl
            }
          : null
  };
};

const REQUIRED_ACTION_WRITE_MAX_RETRIES = 3;
const INITIAL_REQUIRED_ACTION_DELAY_MS = 10_000;

const ensureSingleSystemNotificationsForMessages = async (
  userId: string,
  candidateMessages: string[]
): Promise<NotificationItem[]> => {
  for (let attempt = 1; attempt <= REQUIRED_ACTION_WRITE_MAX_RETRIES; attempt += 1) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const existingSystemNotifications = await tx.notification.findMany({
            where: {
              recipientUserId: userId,
              messageType: 'SYSTEM_MESSAGE',
              message: {
                in: candidateMessages
              }
            },
            select: {
              id: true,
              message: true,
              createdAt: true
            },
            orderBy: {
              createdAt: 'desc'
            }
          });

          const seenMessages = new Set<string>();
          const duplicateIds: string[] = [];

          existingSystemNotifications.forEach((notification) => {
            if (seenMessages.has(notification.message)) {
              duplicateIds.push(notification.id);
              return;
            }

            seenMessages.add(notification.message);
          });

          if (duplicateIds.length > 0) {
            await tx.notification.deleteMany({
              where: {
                id: {
                  in: duplicateIds
                }
              }
            });
          }

          const messagesToCreate = candidateMessages.filter((message) => !seenMessages.has(message));

          if (messagesToCreate.length === 0) {
            return [];
          }

          const createdNotifications = await Promise.all(
            messagesToCreate.map((message) =>
              tx.notification.create({
                data: {
                  id: randomUUID(),
                  recipientUserId: userId,
                  senderUserId: null,
                  message,
                  messageType: 'SYSTEM_MESSAGE'
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
              })
            )
          );

          return createdNotifications.map((notification) => mapNotification(notification));
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );
    } catch (error) {
      const isRetryableSerializationError =
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034';

      if (!isRetryableSerializationError || attempt === REQUIRED_ACTION_WRITE_MAX_RETRIES) {
        throw error;
      }
    }
  }

  return [];
};

export const createNotification = async ({
  recipientUserId,
  senderUserId,
  message,
  messageType
}: CreateNotificationInput): Promise<NotificationItem> => {
  const sanitizedMessage = message.trim();
  const normalizedMessageType = messageType === 'ADMIN_MESSAGE' ? 'SYSTEM_MESSAGE' : messageType;
  const normalizedSenderUserId = normalizedMessageType === 'SYSTEM_MESSAGE' ? null : senderUserId ?? null;

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

  if (normalizedSenderUserId) {
    const senderUser = await prisma.user.findUnique({
      where: { id: normalizedSenderUserId },
      select: {
        id: true,
        role: true
      }
    });

    if (!senderUser) {
      throw new AppError(404, 'Sender user not found');
    }

    if (senderUser.role !== 'ADMIN') {
      throw new AppError(403, 'Only admins can send non-system notifications');
    }
  }

  const createdNotification = await prisma.notification.create({
    data: {
      id: randomUUID(),
      recipientUserId,
      senderUserId: normalizedSenderUserId,
      message: sanitizedMessage,
      messageType: normalizedMessageType
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

export const deleteAllUserNotifications = async (userId: string, userRole: UserRole): Promise<number> => {
  if (userRole !== 'USER') {
    throw new AppError(403, 'Only users can clear notifications');
  }

  const { count } = await prisma.notification.deleteMany({
    where: {
      recipientUserId: userId
    }
  });

  return count;
};

export const ensureRequiredActionNotificationsForUser = async (userId: string): Promise<NotificationItem[]> => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
      id: true,
      role: true,
      createdAt: true,
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

  if (Date.now() - user.createdAt.getTime() < INITIAL_REQUIRED_ACTION_DELAY_MS) {
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

  return ensureSingleSystemNotificationsForMessages(userId, candidateMessages);
};
