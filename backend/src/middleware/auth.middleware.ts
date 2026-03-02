import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { clearAuthCookies, verifyAccessToken } from '../utils/jwt';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const payload = verifyAccessToken(token);

    if (payload.role === 'USER') {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          emailVerifiedAt: true,
          emailVerificationTokenExpiresAt: true
        }
      });

      if (!user) {
        clearAuthCookies(res);
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const verificationWindowExpired =
        !user.emailVerifiedAt &&
        user.emailVerificationTokenExpiresAt &&
        user.emailVerificationTokenExpiresAt.getTime() <= Date.now();

      if (verificationWindowExpired) {
        clearAuthCookies(res);
        res.status(401).json({ message: 'Email verification window has expired. Please sign in again.' });
        return;
      }
    }

    req.user = payload;
    next();
  } catch (_error) {
    clearAuthCookies(res);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  if (req.user.role !== 'ADMIN') {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  next();
};
