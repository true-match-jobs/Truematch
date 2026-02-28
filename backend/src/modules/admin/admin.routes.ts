import { Router } from 'express';
import { authMiddleware, requireAdmin } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../utils/async-handler';
import {
	getAllApplicationsForAdminHandler,
	getApplicationDetailsForAdminHandler,
	updateApplicationStatusHandler
} from '../application/application.controller';

export const adminRouter = Router();

adminRouter.get('/applications', authMiddleware, requireAdmin, asyncHandler(getAllApplicationsForAdminHandler));
adminRouter.get('/applications/:id', authMiddleware, requireAdmin, asyncHandler(getApplicationDetailsForAdminHandler));
adminRouter.patch('/applications/:id/status', authMiddleware, requireAdmin, asyncHandler(updateApplicationStatusHandler));