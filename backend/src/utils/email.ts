import nodemailer from 'nodemailer';
import { env } from '../config/env';

type SendEmailArgs = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

const hasSmtpConfig =
  Boolean(env.SMTP_HOST) &&
  Boolean(env.SMTP_PORT) &&
  Boolean(env.SMTP_USER) &&
  Boolean(env.SMTP_PASS) &&
  Boolean(env.SMTP_FROM_EMAIL);

const getTransporter = (port: number) => {
  if (!hasSmtpConfig) {
    return null;
  }

  const host = env.SMTP_HOST?.trim();

  if (!host) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    requireTLS: port !== 465,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    },
    tls: {
      servername: host
    }
  });
};

const isTimeoutError = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }

  const maybeCode = (error as Error & { code?: string }).code;

  if (maybeCode === 'ETIMEDOUT') {
    return true;
  }

  return error.message.toLowerCase().includes('timeout');
};

const getPortSequence = (): number[] => {
  const configuredPort = env.SMTP_PORT;
  const fallbackPort = configuredPort === 465 ? 587 : 465;

  return [configuredPort, fallbackPort];
};

export const sendEmail = async ({ to, subject, html, text }: SendEmailArgs): Promise<void> => {
  if (!hasSmtpConfig) {
    const warning = 'SMTP configuration missing. Email not sent.';

    if (env.NODE_ENV === 'production') {
      throw new Error(warning);
    }

    console.warn(warning, { to, subject });
    return;
  }

  const fromName = env.SMTP_FROM_NAME?.trim() || 'TrueMatch';
  const fromAddress = env.SMTP_FROM_EMAIL as string;

  const [primaryPort, fallbackPort] = getPortSequence();
  const primaryTransporter = getTransporter(primaryPort);

  if (!primaryTransporter) {
    throw new Error('SMTP transporter could not be created');
  }

  try {
    await primaryTransporter.sendMail({
      from: `${fromName} <${fromAddress}>`,
      to,
      subject,
      html,
      text
    });
    return;
  } catch (error) {
    if (!isTimeoutError(error)) {
      throw error;
    }

    const fallbackTransporter = getTransporter(fallbackPort);

    if (!fallbackTransporter) {
      throw error;
    }

    await fallbackTransporter.sendMail({
      from: `${fromName} <${fromAddress}>`,
      to,
      subject,
      html,
      text
    });
  }
};
