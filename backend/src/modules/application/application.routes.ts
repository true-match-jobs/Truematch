import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../utils/async-handler';
import {
	getApplicationTrackerByIdHandler,
	getApplicationByIdHandler,
	markApplicationTrackerViewedHandler,
	submitApplicationHandler,
	uploadApplicationDocumentHandler
} from './application.controller';
import { uploadApplicationDocument } from './application.upload';

export const applicationRouter = Router();

applicationRouter.post('/', asyncHandler(submitApplicationHandler));
applicationRouter.get('/track/:id', asyncHandler(getApplicationTrackerByIdHandler));
applicationRouter.patch('/:id/tracker-viewed', authMiddleware, asyncHandler(markApplicationTrackerViewedHandler));
applicationRouter.get('/:id', authMiddleware, asyncHandler(getApplicationByIdHandler));
applicationRouter.patch(
	'/:applicationId/documents/:documentType',
	authMiddleware,
	uploadApplicationDocument,
	asyncHandler(uploadApplicationDocumentHandler)
);
