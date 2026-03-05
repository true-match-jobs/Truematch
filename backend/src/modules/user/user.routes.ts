import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../utils/async-handler';
import {
	getMyNotificationsHandler,
	markMyNotificationReadHandler,
	getMyUnreadNotificationCountHandler,
	markMyNotificationsReadHandler,
	meAllDataHandler,
	meHandler,
	markMeDashboardVisitedHandler,
	updateMeEmailHandler,
	updateMePasswordHandler,
	updateMeProfileHandler,
	updateMeProfilePhotoHandler
} from './user.controller';
import { uploadProfilePhoto } from './user.upload';

export const userRouter = Router();

userRouter.get('/me', authMiddleware, asyncHandler(meHandler));
userRouter.get('/me/all', authMiddleware, asyncHandler(meAllDataHandler));
userRouter.get('/me/notifications', authMiddleware, asyncHandler(getMyNotificationsHandler));
userRouter.get('/me/notifications/unread-count', authMiddleware, asyncHandler(getMyUnreadNotificationCountHandler));
userRouter.patch('/me/notifications/read-all', authMiddleware, asyncHandler(markMyNotificationsReadHandler));
userRouter.patch('/me/notifications/:notificationId/read', authMiddleware, asyncHandler(markMyNotificationReadHandler));
userRouter.patch('/me/profile', authMiddleware, asyncHandler(updateMeProfileHandler));
userRouter.patch('/me/avatar', authMiddleware, uploadProfilePhoto, asyncHandler(updateMeProfilePhotoHandler));
userRouter.patch('/me/email', authMiddleware, asyncHandler(updateMeEmailHandler));
userRouter.patch('/me/password', authMiddleware, asyncHandler(updateMePasswordHandler));
userRouter.patch('/me/dashboard-visited', authMiddleware, asyncHandler(markMeDashboardVisitedHandler));
