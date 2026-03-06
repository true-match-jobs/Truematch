import { Router } from 'express';
import { authMiddleware, requireAdmin } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../utils/async-handler';
import {
	adminConversationsHandler,
	chatSocketTokenHandler,
	clearAdminConversationsHandler,
	chatPeerHandler,
	conversationMessagesHandler,
	downloadChatAttachmentHandler,
	markConversationReadHandler,
	unreadSummaryHandler,
	uploadChatAttachmentHandler
} from './chat.controller';
import { uploadChatAttachment } from './chat.upload';

export const chatRouter = Router();

chatRouter.get('/socket-token', authMiddleware, asyncHandler(chatSocketTokenHandler));
chatRouter.get('/peer', authMiddleware, asyncHandler(chatPeerHandler));
chatRouter.get('/messages/:peerUserId', authMiddleware, asyncHandler(conversationMessagesHandler));
chatRouter.get('/conversations', authMiddleware, requireAdmin, asyncHandler(adminConversationsHandler));
chatRouter.post('/conversations/clear', authMiddleware, requireAdmin, asyncHandler(clearAdminConversationsHandler));
chatRouter.get('/unread-summary', authMiddleware, asyncHandler(unreadSummaryHandler));
chatRouter.patch('/read/:peerUserId', authMiddleware, asyncHandler(markConversationReadHandler));
chatRouter.post('/attachments', authMiddleware, uploadChatAttachment, asyncHandler(uploadChatAttachmentHandler));
chatRouter.post('/attachments/download', authMiddleware, asyncHandler(downloadChatAttachmentHandler));
