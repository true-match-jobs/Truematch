import type { User } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import { env } from '../../config/env';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/app-error';
import { sendEmail } from '../../utils/email';
import { comparePassword, hashPassword } from '../../utils/hash';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import type { LoginDto, RegisterDto } from './auth.validation';

type SanitizedUser = Omit<User, 'password'>;

type AuthResponse = {
  user: SanitizedUser;
  accessToken: string;
  refreshToken: string;
};

const sanitizeUser = (user: User): SanitizedUser => {
  const { password: _password, ...safeUser } = user;
  return safeUser;
};

const buildEmailVerificationLink = (token: string) => {
  const baseUrl = env.FRONTEND_ORIGIN.replace(/\/+$/, '');
  return `${baseUrl}/#/verify-email?token=${encodeURIComponent(token)}`;
};

const buildEmailVerificationHtml = (fullName: string, verificationLink: string, expiresInHours: number) => {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827; max-width: 640px; margin: 0 auto;">
      <h2 style="margin: 0 0 12px;">Verify your email address</h2>
      <p style="margin: 0 0 12px;">Hi ${fullName},</p>
      <p style="margin: 0 0 12px;">
        Thanks for submitting your TrueMatch application. Please verify your email to secure your account and continue receiving important updates.
      </p>
      <p style="margin: 18px 0;">
        <a href="${verificationLink}" style="background: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 16px; border-radius: 6px; display: inline-block;">
          Verify Email
        </a>
      </p>
      <p style="margin: 0 0 10px; font-size: 14px; color: #4b5563;">
        This link expires in ${expiresInHours} hour${expiresInHours === 1 ? '' : 's'}.
      </p>
      <p style="margin: 0; font-size: 13px; color: #6b7280; word-break: break-all;">${verificationLink}</p>
    </div>
  `;
};

const buildEmailVerificationText = (fullName: string, verificationLink: string, expiresInHours: number) => {
  return `Hi ${fullName},\n\nThanks for submitting your TrueMatch application. Please verify your email to secure your account and continue receiving important updates.\n\nVerify your email: ${verificationLink}\n\nThis link expires in ${expiresInHours} hour${expiresInHours === 1 ? '' : 's'}.`;
};

const hashEmailVerificationToken = (token: string) => {
  return createHash('sha256').update(token).digest('hex');
};

const createEmailVerificationToken = () => {
  return randomBytes(32).toString('hex');
};

export const sendEmailVerification = async (userId: string): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      emailVerifiedAt: true,
      emailVerificationLastSentAt: true
    }
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  if (user.emailVerifiedAt) {
    return;
  }

  const resendCooldownSeconds = env.EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS;
  const now = Date.now();

  if (
    user.emailVerificationLastSentAt &&
    now - user.emailVerificationLastSentAt.getTime() < resendCooldownSeconds * 1000
  ) {
    throw new AppError(429, `Please wait ${resendCooldownSeconds} seconds before requesting another verification email`);
  }

  const rawToken = createEmailVerificationToken();
  const tokenHash = hashEmailVerificationToken(rawToken);
  const expiresInHours = env.EMAIL_VERIFICATION_TOKEN_EXPIRES_HOURS;
  const tokenExpiresAt = new Date(now + expiresInHours * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerificationTokenHash: tokenHash,
      emailVerificationTokenExpiresAt: tokenExpiresAt,
      emailVerificationLastSentAt: new Date(now)
    }
  });

  const verificationLink = buildEmailVerificationLink(rawToken);

  await sendEmail({
    to: user.email,
    subject: 'Verify your email address — TrueMatch',
    html: buildEmailVerificationHtml(user.fullName, verificationLink, expiresInHours),
    text: buildEmailVerificationText(user.fullName, verificationLink, expiresInHours)
  });
};

export const verifyEmailAddress = async (token: string): Promise<void> => {
  const tokenHash = hashEmailVerificationToken(token);

  const user = await prisma.user.findFirst({
    where: {
      emailVerificationTokenHash: tokenHash,
      emailVerificationTokenExpiresAt: {
        gt: new Date()
      }
    },
    select: {
      id: true,
      emailVerifiedAt: true
    }
  });

  if (!user) {
    throw new AppError(400, 'Invalid or expired verification link');
  }

  if (user.emailVerifiedAt) {
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifiedAt: new Date(),
      emailVerificationTokenHash: null,
      emailVerificationTokenExpiresAt: null
    }
  });
};

export const register = async (payload: RegisterDto): Promise<AuthResponse> => {
  const existing = await prisma.user.findUnique({ where: { email: payload.email } });
  if (existing) {
    throw new AppError(409, 'Email already exists');
  }

  const hashedPassword = await hashPassword(payload.password);

  const user = await prisma.user.create({
    data: {
      fullName: payload.fullName,
      email: payload.email,
      password: hashedPassword,
      role: 'USER'
    }
  });

  if (user.role === 'USER') {
    try {
      await sendEmailVerification(user.id);
    } catch (error) {
      console.error('Failed to send registration verification email', error);
    }
  }

  const jwtPayload = { userId: user.id, email: user.email, role: user.role };

  return {
    user: sanitizeUser(user),
    accessToken: signAccessToken(jwtPayload),
    refreshToken: signRefreshToken(jwtPayload)
  };
};

export const login = async (payload: LoginDto): Promise<AuthResponse> => {
  const user = await prisma.user.findUnique({ where: { email: payload.email } });

  if (!user) {
    throw new AppError(401, 'Invalid credentials');
  }

  const validPassword = await comparePassword(payload.password, user.password);
  if (!validPassword) {
    throw new AppError(401, 'Invalid credentials');
  }

  if (user.role === 'USER' && !user.emailVerifiedAt) {
    const verificationWindowExpired =
      !user.emailVerificationTokenExpiresAt || user.emailVerificationTokenExpiresAt.getTime() <= Date.now();

    if (verificationWindowExpired) {
      try {
        await sendEmailVerification(user.id);
      } catch (error) {
        console.error('Failed to send login verification email', error);
      }
    }
  }

  const latestUser = await prisma.user.findUnique({ where: { id: user.id } });

  if (!latestUser) {
    throw new AppError(404, 'User not found');
  }

  const jwtPayload = { userId: latestUser.id, email: latestUser.email, role: latestUser.role };

  return {
    user: sanitizeUser(latestUser),
    accessToken: signAccessToken(jwtPayload),
    refreshToken: signRefreshToken(jwtPayload)
  };
};

export const refreshAuth = async (refreshToken: string): Promise<AuthResponse> => {
  const payload = verifyRefreshToken(refreshToken);
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  if (
    user.role === 'USER' &&
    !user.emailVerifiedAt &&
    user.emailVerificationTokenExpiresAt &&
    user.emailVerificationTokenExpiresAt.getTime() <= Date.now()
  ) {
    throw new AppError(401, 'Email verification window has expired. Please sign in again.');
  }

  const jwtPayload = { userId: user.id, email: user.email, role: user.role };

  return {
    user: sanitizeUser(user),
    accessToken: signAccessToken(jwtPayload),
    refreshToken: signRefreshToken(jwtPayload)
  };
};

export const resendEmailVerification = async (userId: string): Promise<void> => {
  await sendEmailVerification(userId);
};
