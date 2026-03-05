import type { Request, Response } from 'express';
import { AppError } from '../../utils/app-error';
import { signAccessToken } from '../../utils/jwt';
import {
  downloadChatAttachmentFile,
  getAdminConversations,
  getConversationMessages,
  getUnreadSummary,
  markConversationRead,
  resolveChatPeer,
  uploadChatAttachmentFile
} from './chat.service';

export const chatSocketTokenHandler = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError(401, 'Unauthorized');
  }

  const token = signAccessToken({
    userId: req.user.userId,
    email: req.user.email,
    role: req.user.role
  });

  res.status(200).json({ token });
};

export const chatPeerHandler = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError(401, 'Unauthorized');
  }

  const peer = await resolveChatPeer(req.user.userId, req.user.role, req.query.userId as string | undefined);

  res.status(200).json({ peer });
};

export const conversationMessagesHandler = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError(401, 'Unauthorized');
  }

  const rawPeerUserId = req.params.peerUserId;
  const peerUserId = Array.isArray(rawPeerUserId) ? rawPeerUserId[0] : rawPeerUserId;

  if (!peerUserId) {
    throw new AppError(400, 'Peer user ID is required');
  }

  await resolveChatPeer(req.user.userId, req.user.role, peerUserId);
  const messages = await getConversationMessages(req.user.userId, peerUserId);

  res.status(200).json({ messages });
};

export const adminConversationsHandler = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError(401, 'Unauthorized');
  }

  if (req.user.role !== 'ADMIN') {
    throw new AppError(403, 'Forbidden');
  }

  const conversations = await getAdminConversations(req.user.userId);

  res.status(200).json({ conversations });
};

export const unreadSummaryHandler = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError(401, 'Unauthorized');
  }

  const summary = await getUnreadSummary(req.user.userId, req.user.role);

  res.status(200).json({ summary });
};

export const markConversationReadHandler = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError(401, 'Unauthorized');
  }

  const rawPeerUserId = req.params.peerUserId;
  const peerUserId = Array.isArray(rawPeerUserId) ? rawPeerUserId[0] : rawPeerUserId;

  if (!peerUserId) {
    throw new AppError(400, 'Peer user ID is required');
  }

  await resolveChatPeer(req.user.userId, req.user.role, peerUserId);
  await markConversationRead(req.user.userId, peerUserId);

  res.status(200).json({ message: 'Conversation marked as read' });
};

export const uploadChatAttachmentHandler = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError(401, 'Unauthorized');
  }

  if (!req.file) {
    throw new AppError(400, 'A file is required');
  }

  const uploadedFile = await uploadChatAttachmentFile(req.file);

  res.status(200).json({
    file: uploadedFile
  });
};

export const downloadChatAttachmentHandler = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError(401, 'Unauthorized');
  }

  const { url, name, mimeType } = req.body as {
    url?: unknown;
    name?: unknown;
    mimeType?: unknown;
  };

  if (typeof url !== 'string' || typeof name !== 'string') {
    throw new AppError(400, 'Attachment URL and filename are required');
  }

  const downloadedFile = await downloadChatAttachmentFile({
    url,
    name,
    mimeType: typeof mimeType === 'string' ? mimeType : undefined
  });

  res.setHeader('Content-Type', downloadedFile.contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${downloadedFile.fileName}"`);
  res.setHeader('Cache-Control', 'private, no-store');
  res.status(200).send(downloadedFile.buffer);
};
