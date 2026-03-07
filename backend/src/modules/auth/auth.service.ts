import type { User } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import { env } from '../../config/env';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/app-error';
import { sendEmail } from '../../utils/email';
import { comparePassword, hashPassword } from '../../utils/hash';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import type { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto } from './auth.validation';

type SensitiveUserFields =
  | 'password'
  | 'emailVerificationTokenHash'
  | 'emailVerificationTokenExpiresAt'
  | 'emailVerificationLastSentAt'
  | 'passwordResetTokenHash'
  | 'passwordResetTokenExpiresAt'
  | 'passwordResetLastSentAt';

type SanitizedUser = Omit<User, SensitiveUserFields>;

type AuthResponse = {
  user: SanitizedUser;
  accessToken: string;
  refreshToken: string;
};

const sanitizeUser = (user: User): SanitizedUser => {
  const {
    password: _password,
    emailVerificationTokenHash: _emailVerificationTokenHash,
    emailVerificationTokenExpiresAt: _emailVerificationTokenExpiresAt,
    emailVerificationLastSentAt: _emailVerificationLastSentAt,
    passwordResetTokenHash: _passwordResetTokenHash,
    passwordResetTokenExpiresAt: _passwordResetTokenExpiresAt,
    passwordResetLastSentAt: _passwordResetLastSentAt,
    ...safeUser
  } = user;

  return safeUser;
};

const getFrontendBaseUrl = () => {
  return env.FRONTEND_ORIGIN.replace(/\/+$/, '').replace(/#\/?$/, '');
};

const buildEmailVerificationLink = (token: string) => {
  const baseUrl = getFrontendBaseUrl();
  return `${baseUrl}/#/verify-email?token=${encodeURIComponent(token)}`;
};

const buildPasswordResetLink = (token: string) => {
  const baseUrl = getFrontendBaseUrl();
  return `${baseUrl}/#/reset-password?token=${encodeURIComponent(token)}`;
};

const escapeHtml = (value: string) => {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const formatExpiryForEmail = (expiresAt: Date) => {
  const prettyDate = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC'
  }).format(expiresAt);

  return `${prettyDate} UTC`;
};

type BrandedActionEmailOptions = {
  preheader: string;
  title: string;
  greetingName: string;
  body: string;
  buttonLabel: string;
  actionLink: string;
  expiresAt: Date;
};

const buildBrandedActionEmailHtml = ({
  preheader,
  title,
  greetingName,
  body,
  buttonLabel,
  actionLink,
  expiresAt
}: BrandedActionEmailOptions) => {
  const baseUrl = getFrontendBaseUrl();
  const logoUrl = env.EMAIL_LOGO_URL?.trim() || `${baseUrl}/logos/logo-tm.png`;
  const expiryText = formatExpiryForEmail(expiresAt);
  const currentYear = new Date().getFullYear();
  const safeFullName = escapeHtml(greetingName);
  const safePreheader = escapeHtml(preheader);
  const safeTitle = escapeHtml(title);
  const safeBody = escapeHtml(body);
  const safeButtonLabel = escapeHtml(buttonLabel);

  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="dark" />
    <meta name="supported-color-schemes" content="dark" />
    <title>${safeTitle}</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #09090b; color: #fafafa; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; mso-hide: all;">
      ${safePreheader}
    </div>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #09090b; padding: 24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 640px; background-color: #131316; border: 1px solid #27272a; border-radius: 12px; overflow: hidden;">
            <tr>
              <td align="center" style="padding: 20px 24px; border-bottom: 1px solid #27272a; background-color: #09090b; text-align: center;">
                <img src="${logoUrl}" alt="" width="160" style="display: block; width: 160px; height: auto; border: 0; margin: 0 auto;" />
              </td>
            </tr>

            <tr>
              <td style="padding: 28px 24px;">
                <h1 style="margin: 0 0 14px; color: #fafafa; font-size: 24px; line-height: 1.25; font-weight: 700;">
                  ${safeTitle}
                </h1>
                <p style="margin: 0 0 12px; color: #d4d4d8; font-size: 15px; line-height: 1.6;">
                  Hi ${safeFullName},
                </p>
                <p style="margin: 0 0 18px; color: #d4d4d8; font-size: 15px; line-height: 1.6;">
                  ${safeBody}
                </p>

                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 18px;">
                  <tr>
                    <td align="center" style="border-radius: 8px; background-color: #7c3aed;">
                      <a href="${actionLink}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 12px 20px; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; line-height: 1; border-radius: 8px;">
                        ${safeButtonLabel}
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin: 0 0 10px; color: #a1a1aa; font-size: 13px; line-height: 1.6;">
                  This link expires on <strong style="color: #fafafa;">${expiryText}</strong>.
                </p>

                <p style="margin: 0 0 8px; color: #a1a1aa; font-size: 13px; line-height: 1.6;">
                  If the button does not work, copy and paste this link into your browser:
                </p>
                <p style="margin: 0; font-size: 13px; line-height: 1.6; word-break: break-all;">
                  <a href="${actionLink}" target="_blank" rel="noopener noreferrer" style="color: #a78bfa; text-decoration: underline;">${actionLink}</a>
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding: 16px 24px 20px; border-top: 1px solid #27272a; background-color: #09090b;">
                <p style="margin: 0 0 6px; text-align: center; color: #a1a1aa; font-size: 12px; line-height: 1.5;">
                  © ${currentYear} TrueMatch
                </p>
                <p style="margin: 0; text-align: center; color: #a1a1aa; font-size: 12px; line-height: 1.5;">
                  Contact: <a href="mailto:support@truematch.chat" style="color: #a78bfa; text-decoration: underline;">support@truematch.chat</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `;
};

const buildBrandedActionEmailText = ({
  greetingName,
  body,
  buttonLabel,
  actionLink,
  expiresAt
}: BrandedActionEmailOptions) => {
  const expiryText = formatExpiryForEmail(expiresAt);

  return `Hi ${greetingName},\n\n${body}\n\n${buttonLabel}: ${actionLink}\n\nThis link expires on ${expiryText}.\n\nNeed help? Contact support@truematch.chat`;
};

const buildEmailVerificationHtml = (fullName: string, verificationLink: string, expiresAt: Date) => {
  return buildBrandedActionEmailHtml({
    preheader: 'Verify your TrueMatch email address to secure your account.',
    title: 'Verify your email address',
    greetingName: fullName,
    body: 'Thanks for submitting your TrueMatch application. Please verify your email to protect your account and continue receiving application updates.',
    buttonLabel: 'Verify Email',
    actionLink: verificationLink,
    expiresAt
  });
};

const buildEmailVerificationText = (fullName: string, verificationLink: string, expiresAt: Date) => {
  return buildBrandedActionEmailText({
    preheader: 'Verify your TrueMatch email address to secure your account.',
    title: 'Verify your email address',
    greetingName: fullName,
    body: 'Thanks for submitting your TrueMatch application. Please verify your email to protect your account and continue receiving application updates.',
    buttonLabel: 'Verify Email',
    actionLink: verificationLink,
    expiresAt
  });
};

const buildPasswordResetHtml = (fullName: string, resetLink: string, expiresAt: Date) => {
  return buildBrandedActionEmailHtml({
    preheader: 'Use this secure link to reset your TrueMatch password.',
    title: 'Reset your password',
    greetingName: fullName,
    body: 'We received a request to reset your TrueMatch password. Use the button below to create a new password. If you did not request this, you can safely ignore this email.',
    buttonLabel: 'Reset Password',
    actionLink: resetLink,
    expiresAt
  });
};

const buildPasswordResetText = (fullName: string, resetLink: string, expiresAt: Date) => {
  return buildBrandedActionEmailText({
    preheader: 'Use this secure link to reset your TrueMatch password.',
    title: 'Reset your password',
    greetingName: fullName,
    body: 'We received a request to reset your TrueMatch password. Use this link to create a new password. If you did not request this, you can safely ignore this email.',
    buttonLabel: 'Reset Password',
    actionLink: resetLink,
    expiresAt
  });
};

const hashToken = (token: string) => {
  return createHash('sha256').update(token).digest('hex');
};

const createSecureToken = () => {
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

  const rawToken = createSecureToken();
  const tokenHash = hashToken(rawToken);
  const expiresInHours = env.EMAIL_VERIFICATION_TOKEN_EXPIRES_HOURS;
  const tokenExpiresAt = new Date(now + expiresInHours * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerificationTokenHash: tokenHash,
      emailVerificationTokenExpiresAt: tokenExpiresAt
    }
  });

  const verificationLink = buildEmailVerificationLink(rawToken);

  try {
    await sendEmail({
      to: user.email,
      subject: 'Verify your email address — TrueMatch',
      html: buildEmailVerificationHtml(user.fullName, verificationLink, tokenExpiresAt),
      text: buildEmailVerificationText(user.fullName, verificationLink, tokenExpiresAt)
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationLastSentAt: new Date(now)
      }
    });
  } catch (error) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationTokenHash: null,
        emailVerificationTokenExpiresAt: null
      }
    });

    throw error;
  }
};

export const verifyEmailAddress = async (token: string): Promise<void> => {
  const tokenHash = hashToken(token);

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

export const requestPasswordReset = async (payload: ForgotPasswordDto): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
    select: {
      id: true,
      fullName: true,
      email: true,
      passwordResetLastSentAt: true
    }
  });

  if (!user) {
    return;
  }

  const now = Date.now();
  const cooldownSeconds = env.PASSWORD_RESET_RESEND_COOLDOWN_SECONDS;

  if (user.passwordResetLastSentAt && now - user.passwordResetLastSentAt.getTime() < cooldownSeconds * 1000) {
    return;
  }

  const rawToken = createSecureToken();
  const tokenHash = hashToken(rawToken);
  const tokenExpiresAt = new Date(now + env.PASSWORD_RESET_TOKEN_EXPIRES_MINUTES * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetTokenHash: tokenHash,
      passwordResetTokenExpiresAt: tokenExpiresAt
    }
  });

  const resetLink = buildPasswordResetLink(rawToken);

  try {
    await sendEmail({
      to: user.email,
      subject: 'Reset your password — TrueMatch',
      html: buildPasswordResetHtml(user.fullName, resetLink, tokenExpiresAt),
      text: buildPasswordResetText(user.fullName, resetLink, tokenExpiresAt)
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetLastSentAt: new Date(now)
      }
    });
  } catch (error) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetTokenHash: null,
        passwordResetTokenExpiresAt: null
      }
    });

    throw error;
  }
};

export const resetPassword = async (payload: ResetPasswordDto): Promise<void> => {
  const tokenHash = hashToken(payload.token);

  const user = await prisma.user.findFirst({
    where: {
      passwordResetTokenHash: tokenHash,
      passwordResetTokenExpiresAt: {
        gt: new Date()
      }
    },
    select: {
      id: true
    }
  });

  if (!user) {
    throw new AppError(400, 'Invalid or expired password reset link');
  }

  const hashedPassword = await hashPassword(payload.password);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      passwordResetTokenHash: null,
      passwordResetTokenExpiresAt: null,
      passwordResetLastSentAt: null
    }
  });
};
