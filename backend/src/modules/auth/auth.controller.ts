import type { Request, Response } from 'express';
import { AppError } from '../../utils/app-error';
import { clearAuthCookies, setAuthCookies } from '../../utils/jwt';
import {
  login,
  refreshAuth,
  register,
  requestPasswordReset,
  resendEmailVerification,
  resetPassword,
  verifyEmailAddress
} from './auth.service';
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from './auth.validation';

export const registerHandler = async (req: Request, res: Response): Promise<void> => {
  const dto = registerSchema.parse(req.body);
  const authData = await register(dto);

  setAuthCookies(res, authData.accessToken, authData.refreshToken);

  res.status(201).json({
    message: 'Registration successful',
    user: authData.user
  });
};

export const loginHandler = async (req: Request, res: Response): Promise<void> => {
  const dto = loginSchema.parse(req.body);
  const authData = await login(dto);

  setAuthCookies(res, authData.accessToken, authData.refreshToken);

  res.status(200).json({
    message: 'Login successful',
    user: authData.user
  });
};

export const refreshHandler = async (req: Request, res: Response): Promise<void> => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw new AppError(401, 'Refresh token missing');
  }

  try {
    const authData = await refreshAuth(refreshToken);
    setAuthCookies(res, authData.accessToken, authData.refreshToken);

    res.status(200).json({
      message: 'Session refreshed',
      user: authData.user
    });
  } catch (error) {
    clearAuthCookies(res);
    throw error;
  }
};

export const logoutHandler = (_req: Request, res: Response): void => {
  clearAuthCookies(res);
  res.status(200).json({ message: 'Logout successful' });
};

export const verifyEmailHandler = async (req: Request, res: Response): Promise<void> => {
  const token = typeof req.query.token === 'string' ? req.query.token.trim() : '';

  if (!token) {
    throw new AppError(400, 'Verification token is required');
  }

  await verifyEmailAddress(token);

  res.status(200).json({
    message: 'Email verified successfully'
  });
};

export const resendEmailVerificationHandler = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError(401, 'Unauthorized');
  }

  await resendEmailVerification(req.user.userId);

  res.status(200).json({
    message: 'Verification email sent'
  });
};

export const forgotPasswordHandler = async (req: Request, res: Response): Promise<void> => {
  const dto = forgotPasswordSchema.parse(req.body);

  await requestPasswordReset(dto);

  res.status(200).json({
    message: 'If an account exists for this email, a password reset link has been sent.'
  });
};

export const resetPasswordHandler = async (req: Request, res: Response): Promise<void> => {
  const dto = resetPasswordSchema.parse(req.body);

  await resetPassword(dto);

  res.status(200).json({
    message: 'Password updated successfully. You can now sign in with your new password.'
  });
};
