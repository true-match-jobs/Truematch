import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../utils/async-handler';
import { meAllDataHandler, meHandler } from './user.controller';

export const userRouter = Router();

userRouter.get('/me', authMiddleware, asyncHandler(meHandler));
userRouter.get('/me/all', authMiddleware, asyncHandler(meAllDataHandler));
