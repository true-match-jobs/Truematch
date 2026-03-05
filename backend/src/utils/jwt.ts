import type { Response } from 'express';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export type JwtPayload = {
  userId: string;
  email: string;
  role: 'USER' | 'ADMIN';
};

const baseCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/'
};

const parseExpiresToMs = (value: string): number => {
  const match = value.match(/^(\d+)([mhd])$/i);
  if (!match) {
    throw new Error(`Unsupported expires format: ${value}`);
  }

  const count = Number(match[1]);
  const unit = match[2].toLowerCase();

  if (unit === 'm') return count * 60 * 1000;
  if (unit === 'h') return count * 60 * 60 * 1000;
  return count * 24 * 60 * 60 * 1000;
};

const signToken = (payload: JwtPayload, secret: string, expiresIn: string): string => {
  const options: SignOptions = { expiresIn: expiresIn as SignOptions['expiresIn'] };
  return jwt.sign(payload, secret, options);
};

export const signAccessToken = (payload: JwtPayload): string => {
  return signToken(payload, env.JWT_ACCESS_SECRET, env.ACCESS_TOKEN_EXPIRES_IN);
};

export const signRefreshToken = (payload: JwtPayload): string => {
  return signToken(payload, env.JWT_REFRESH_SECRET, env.REFRESH_TOKEN_EXPIRES_IN);
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
};

export const setAuthCookies = (res: Response, accessToken: string, refreshToken: string): void => {
  res.cookie('accessToken', accessToken, {
    ...baseCookieOptions,
    maxAge: parseExpiresToMs(env.ACCESS_TOKEN_EXPIRES_IN),
    domain: env.COOKIE_DOMAIN
  });

  res.cookie('refreshToken', refreshToken, {
    ...baseCookieOptions,
    maxAge: parseExpiresToMs(env.REFRESH_TOKEN_EXPIRES_IN),
    domain: env.COOKIE_DOMAIN
  });
};

export const clearAuthCookies = (res: Response): void => {
  const clearOptions = {
    ...baseCookieOptions,
    domain: env.COOKIE_DOMAIN
  };

  res.clearCookie('accessToken', clearOptions);
  res.clearCookie('refreshToken', clearOptions);
};
