import type { Request, Response } from 'express';
import { AppError } from '../../utils/app-error';
import {
  getAdminConversations,
  getConversationMessages,
  getUnreadSummary,
  markConversationRead,
  resolveChatPeer,
  uploadChatAttachmentFile
} from './chat.service';

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
