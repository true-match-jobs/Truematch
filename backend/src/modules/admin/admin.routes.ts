import { Router } from 'express';
import { authMiddleware, requireAdmin } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../utils/async-handler';
import { uploadNavbarLogoHandler } from './admin.logo.controller';
import { uploadLogoImage } from './admin.logo.upload';
import {
	deleteApplicationForAdminHandler,
	getAllApplicationsForAdminHandler,
	getApplicationDetailsForAdminHandler,
	updateApplicationStatusHandler
} from '../application/application.controller';
import { deleteUserForAdminHandler, getAllUsersForAdminHandler } from './admin.user.controller';

export const adminRouter = Router();

adminRouter.get('/applications', authMiddleware, requireAdmin, asyncHandler(getAllApplicationsForAdminHandler));
adminRouter.get('/applications/:id', authMiddleware, requireAdmin, asyncHandler(getApplicationDetailsForAdminHandler));
adminRouter.patch('/applications/:id/status', authMiddleware, requireAdmin, asyncHandler(updateApplicationStatusHandler));
adminRouter.delete('/applications/:id', authMiddleware, requireAdmin, asyncHandler(deleteApplicationForAdminHandler));
adminRouter.get('/users', authMiddleware, requireAdmin, asyncHandler(getAllUsersForAdminHandler));
adminRouter.delete('/users/:id', authMiddleware, requireAdmin, asyncHandler(deleteUserForAdminHandler));
adminRouter.post('/assets/logo', authMiddleware, requireAdmin, uploadLogoImage, asyncHandler(uploadNavbarLogoHandler));