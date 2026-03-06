import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  FRONTEND_ORIGIN: z
    .string()
    .min(1)
    .refine(
      (value) => {
        const origins = value
          .split(',')
          .map((origin) => origin.trim())
          .filter((origin) => origin.length > 0);

        if (!origins.length) {
          return false;
        }

        return origins.every((origin) => z.string().url().safeParse(origin).success);
      },
      {
        message: 'FRONTEND_ORIGIN must be a URL or comma-separated list of URLs'
      }
    ),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
  COOKIE_DOMAIN: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM_EMAIL: z.string().email().optional(),
  SMTP_FROM_NAME: z.string().optional(),
  EMAIL_LOGO_URL: z.string().url().optional(),
  EMAIL_VERIFICATION_TOKEN_EXPIRES_HOURS: z.coerce.number().int().positive().default(720),
  EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS: z.coerce.number().int().positive().default(60),
  PASSWORD_RESET_TOKEN_EXPIRES_MINUTES: z.coerce.number().int().positive().default(60),
  PASSWORD_RESET_RESEND_COOLDOWN_SECONDS: z.coerce.number().int().positive().default(60),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1)
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('Invalid environment variables:', result.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = result.data;
