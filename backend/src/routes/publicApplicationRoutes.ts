import { Router } from 'express';
import { getPublicApplicationByIdHandler } from '../controllers/publicApplicationController';
import { verifyContractApiKey } from '../middleware/verifyContractApiKey';
import { asyncHandler } from '../utils/async-handler';

export const publicApplicationRouter = Router();

publicApplicationRouter.get('/applications/:id', verifyContractApiKey, asyncHandler(getPublicApplicationByIdHandler));
