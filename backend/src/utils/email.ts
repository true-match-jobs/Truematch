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

const getTransporter = () => {
  if (!hasSmtpConfig) {
    return null;
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    }
  });
};

export const sendEmail = async ({ to, subject, html, text }: SendEmailArgs): Promise<void> => {
  const transporter = getTransporter();

  if (!transporter) {
    const warning = 'SMTP configuration missing. Email not sent.';

    if (env.NODE_ENV === 'production') {
      throw new Error(warning);
    }

    console.warn(warning, { to, subject });
    return;
  }

  const fromName = env.SMTP_FROM_NAME?.trim() || 'TrueMatch';
  const fromAddress = env.SMTP_FROM_EMAIL as string;

  await transporter.sendMail({
    from: `${fromName} <${fromAddress}>`,
    to,
    subject,
    html,
    text
  });
};
