import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authMiddleware } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../utils/async-handler';
import {
  forgotPasswordHandler,
  loginHandler,
  logoutHandler,
  refreshHandler,
  registerHandler,
  resetPasswordHandler,
  resendEmailVerificationHandler,
  verifyEmailHandler
} from './auth.controller';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { message: 'Too many auth attempts, please try again later' }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Too many login attempts, please try again later' }
});

const verificationResendLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { message: 'Too many verification requests, please try again later' }
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Too many password reset requests, please try again later' }
});

const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many reset attempts, please try again later' }
});

export const authRouter = Router();

authRouter.post('/register', authLimiter, asyncHandler(registerHandler));
authRouter.post('/login', loginLimiter, asyncHandler(loginHandler));
authRouter.post('/refresh', authLimiter, asyncHandler(refreshHandler));
authRouter.post('/logout', logoutHandler);
authRouter.get('/email-verification/verify', asyncHandler(verifyEmailHandler));
authRouter.post('/email-verification/resend', authMiddleware, verificationResendLimiter, asyncHandler(resendEmailVerificationHandler));
authRouter.post('/forgot-password', forgotPasswordLimiter, asyncHandler(forgotPasswordHandler));
authRouter.post('/reset-password', resetPasswordLimiter, asyncHandler(resetPasswordHandler));
