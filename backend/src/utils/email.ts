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

const transporter = getTransporter();

export const sendEmail = async ({ to, subject, html, text }: SendEmailArgs): Promise<void> => {
  if (!transporter) {
    throw new Error('SMTP configuration missing. Email not sent.');
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
