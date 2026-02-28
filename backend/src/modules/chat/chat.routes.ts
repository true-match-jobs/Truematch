import { Router } from 'express';
import { authMiddleware, requireAdmin } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../utils/async-handler';
import {
	adminConversationsHandler,
	chatPeerHandler,
	conversationMessagesHandler,
	markConversationReadHandler,
	unreadSummaryHandler,
	uploadChatAttachmentHandler
} from './chat.controller';
import { uploadChatAttachment } from './chat.upload';

export const chatRouter = Router();

chatRouter.get('/peer', authMiddleware, asyncHandler(chatPeerHandler));
chatRouter.get('/messages/:peerUserId', authMiddleware, asyncHandler(conversationMessagesHandler));
chatRouter.get('/conversations', authMiddleware, requireAdmin, asyncHandler(adminConversationsHandler));
chatRouter.get('/unread-summary', authMiddleware, asyncHandler(unreadSummaryHandler));
chatRouter.patch('/read/:peerUserId', authMiddleware, asyncHandler(markConversationReadHandler));
chatRouter.post('/attachments', authMiddleware, uploadChatAttachment, asyncHandler(uploadChatAttachmentHandler));
