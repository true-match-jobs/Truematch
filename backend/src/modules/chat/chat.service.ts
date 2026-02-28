import { randomUUID } from 'crypto';
import type { UserRole } from '@prisma/client';
import type { UploadApiResponse } from 'cloudinary';
import { cloudinary } from '../../config/cloudinary';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/app-error';

const unreadFilter = { isRead: false } as Record<string, boolean>;
const readUpdate = { isRead: true } as Record<string, boolean>;
const ATTACHMENT_PREFIX = '[ATTACHMENT]';

type ChatUser = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
};

export type ChatMessage = {
  id: string;
  fromUserId: string;
  toUserId: string;
  content: string;
  createdAt: string;
};

type AdminConversation = {
  user: ChatUser;
  lastMessageAt: string;
  lastMessagePreview: string;
  unreadMessageCount: number;
};

export type ChatUnreadSummary = {
  userUnreadMessageCount: number;
  adminUnreadUserCount: number;
};

type ChatAttachmentUploadResult = {
  url: string;
  downloadUrl: string;
  mimeType: string;
  name: string;
  previewUrl?: string;
};

const uploadBufferToCloudinary = async (
  file: Express.Multer.File,
  resourceType: 'image' | 'raw'
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'truematch/chat-attachments',
        resource_type: resourceType
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Cloudinary upload failed'));
          return;
        }

        resolve(result);
      }
    );

    uploadStream.end(file.buffer);
  });
};

const getMessagePreview = (content: string): string => {
  if (!content.startsWith(ATTACHMENT_PREFIX)) {
    return content;
  }

  return 'Attachment';
};

const getAssignedAdmin = async (): Promise<ChatUser | null> => {
  return prisma.user.findFirst({
    where: { role: 'ADMIN' },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true
    }
  });
};

const getUserByIdAndRole = async (userId: string, role: UserRole): Promise<ChatUser | null> => {
  return prisma.user.findFirst({
    where: {
      id: userId,
      role
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true
    }
  });
};

export const resolveChatPeer = async (
  currentUserId: string,
  currentUserRole: UserRole,
  requestedUserId?: string
): Promise<ChatUser> => {
  if (currentUserRole === 'USER') {
    const admin = await getAssignedAdmin();
    if (!admin) {
      throw new AppError(404, 'No admin is available for chat yet');
    }

    return admin;
  }

  if (!requestedUserId) {
    throw new AppError(400, 'userId query parameter is required for admin chat');
  }

  if (requestedUserId === currentUserId) {
    throw new AppError(400, 'Cannot open a chat with yourself');
  }

  const user = await getUserByIdAndRole(requestedUserId, 'USER');

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  return user;
};

export const addConversationMessage = async (fromUserId: string, toUserId: string, content: string): Promise<ChatMessage> => {
  const sanitizedContent = content.trim();

  if (!sanitizedContent) {
    throw new AppError(400, 'Message content is required');
  }

  const createdMessage = await prisma.chatMessage.create({
    data: {
      id: randomUUID(),
      fromUserId,
      toUserId,
      content: sanitizedContent
    },
    select: {
      id: true,
      fromUserId: true,
      toUserId: true,
      content: true,
      createdAt: true
    }
  });

  return {
    id: createdMessage.id,
    fromUserId: createdMessage.fromUserId,
    toUserId: createdMessage.toUserId,
    content: createdMessage.content,
    createdAt: createdMessage.createdAt.toISOString()
  };
};

export const getConversationMessages = async (currentUserId: string, peerUserId: string): Promise<ChatMessage[]> => {
  const messages = await prisma.chatMessage.findMany({
    where: {
      OR: [
        {
          fromUserId: currentUserId,
          toUserId: peerUserId
        },
        {
          fromUserId: peerUserId,
          toUserId: currentUserId
        }
      ]
    },
    orderBy: {
      createdAt: 'asc'
    },
    select: {
      id: true,
      fromUserId: true,
      toUserId: true,
      content: true,
      createdAt: true
    }
  });

  return messages.map((message) => ({
    id: message.id,
    fromUserId: message.fromUserId,
    toUserId: message.toUserId,
    content: message.content,
    createdAt: message.createdAt.toISOString()
  }));
};

export const getAdminConversations = async (adminUserId: string): Promise<AdminConversation[]> => {
  const users = await prisma.user.findMany({
    where: { role: 'USER' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true
    }
  });

  const conversationCandidates = await Promise.all(
    users.map(async (user) => {
      const lastMessage = await prisma.chatMessage.findFirst({
        where: {
          OR: [
            {
              fromUserId: adminUserId,
              toUserId: user.id
            },
            {
              fromUserId: user.id,
              toUserId: adminUserId
            }
          ]
        },
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          createdAt: true,
          content: true
        }
      });

      if (!lastMessage) {
        return null;
      }

      const unreadMessageCount = await prisma.chatMessage.count({
        where: {
          fromUserId: user.id,
          toUserId: adminUserId,
          ...unreadFilter
        }
      });

      return {
        user,
        lastMessageAt: lastMessage.createdAt.toISOString(),
        lastMessagePreview: getMessagePreview(lastMessage.content),
        unreadMessageCount
      };
    })
  );

  const conversations = conversationCandidates
    .filter((conversation): conversation is AdminConversation => conversation !== null)
    .sort((first, second) => new Date(second.lastMessageAt).getTime() - new Date(first.lastMessageAt).getTime());

  return conversations;
};

export const getAssignedAdminForUser = async (): Promise<ChatUser | null> => {
  return getAssignedAdmin();
};

export const getUnreadSummary = async (currentUserId: string, currentUserRole: UserRole): Promise<ChatUnreadSummary> => {
  if (currentUserRole === 'USER') {
    const unreadCount = await prisma.chatMessage.count({
      where: {
        toUserId: currentUserId,
        ...unreadFilter
      }
    });

    return {
      userUnreadMessageCount: unreadCount,
      adminUnreadUserCount: 0
    };
  }

  const unreadFromUsers = await prisma.chatMessage.groupBy({
    by: ['fromUserId'],
    where: {
      toUserId: currentUserId,
      ...unreadFilter
    }
  });

  return {
    userUnreadMessageCount: 0,
    adminUnreadUserCount: unreadFromUsers.length
  };
};

export const markConversationRead = async (currentUserId: string, peerUserId: string): Promise<void> => {
  await prisma.chatMessage.updateMany({
    where: {
      fromUserId: peerUserId,
      toUserId: currentUserId,
      ...unreadFilter
    },
    data: readUpdate
  });
};

export const uploadChatAttachmentFile = async (file: Express.Multer.File): Promise<ChatAttachmentUploadResult> => {
  const isPdf = file.mimetype === 'application/pdf';
  const isImage = file.mimetype.startsWith('image/');

  if (!isPdf && !isImage) {
    throw new AppError(400, 'Only PDF and image files are allowed');
  }

  const uploadedFile = await uploadBufferToCloudinary(file, 'image');

  const pdfDownloadUrl = isPdf
    ? cloudinary.url(uploadedFile.public_id, {
        secure: true,
        resource_type: 'image',
        type: 'upload',
        flags: 'attachment',
        format: 'pdf'
      })
    : uploadedFile.secure_url;

  const pdfPreviewUrl = isPdf
    ? cloudinary.url(uploadedFile.public_id, {
        secure: true,
        resource_type: 'image',
        type: 'upload',
        page: 1,
        format: 'jpg'
      })
    : undefined;

  return {
    url: uploadedFile.secure_url,
    downloadUrl: pdfDownloadUrl,
    mimeType: file.mimetype,
    name: file.originalname,
    previewUrl: pdfPreviewUrl
  };
};
