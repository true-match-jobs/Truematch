import nodemailer from 'nodemailer';
import { resolve4 } from 'dns/promises';
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

const getTransporter = (connectHost: string, tlsServerName: string, port: number) => {
  if (!hasSmtpConfig) {
    return null;
  }

  return nodemailer.createTransport({
    host: connectHost,
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
      servername: tlsServerName
    }
  });
};

const isConnectionLevelError = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }

  const maybeCode = (error as Error & { code?: string }).code;

  if (['ETIMEDOUT', 'ECONNECTION', 'ESOCKET', 'EHOSTUNREACH', 'ENETUNREACH'].includes(maybeCode ?? '')) {
    return true;
  }

  return error.message.toLowerCase().includes('timeout');
};

const getHostSequence = (): string[] => {
  const configuredHost = env.SMTP_HOST?.trim() || '';

  if (!configuredHost) {
    return [];
  }

  const hosts = [configuredHost];

  if (configuredHost === 'smtp.zoho.com') {
    hosts.push('smtppro.zoho.com');
  }

  if (configuredHost === 'smtppro.zoho.com') {
    hosts.push('smtp.zoho.com');
  }

  return hosts;
};

const getPortSequence = (): [number, number] => {
  const configuredPort = env.SMTP_PORT ?? 465;
  const fallbackPort = configuredPort === 465 ? 587 : 465;

  return [configuredPort, fallbackPort];
};

const resolveIpv4Addresses = async (host: string): Promise<string[]> => {
  try {
    return await resolve4(host);
  } catch {
    return [];
  }
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
  const hostSequence = getHostSequence();
  const [primaryPort, fallbackPort] = getPortSequence();
  const portSequence = [primaryPort, fallbackPort];

  const hostAttempts = await Promise.all(
    hostSequence.map(async (host) => {
      const ipv4Addresses = await resolveIpv4Addresses(host);

      return {
        host,
        ipv4Addresses
      };
    })
  );

  const attempts: Array<{
    connectHost: string;
    tlsServerName: string;
    port: number;
    mode: 'hostname' | 'ipv4';
  }> = [];

  hostAttempts.forEach(({ host, ipv4Addresses }) => {
    portSequence.forEach((port) => {
      attempts.push({
        connectHost: host,
        tlsServerName: host,
        port,
        mode: 'hostname'
      });

      ipv4Addresses.forEach((ipAddress) => {
        attempts.push({
          connectHost: ipAddress,
          tlsServerName: host,
          port,
          mode: 'ipv4'
        });
      });
    });
  });

  if (!attempts.length) {
    throw new Error('SMTP transporter could not be created');
  }

  let lastError: unknown = null;

  for (let index = 0; index < attempts.length; index += 1) {
    const attempt = attempts[index];
    const transporter = getTransporter(attempt.connectHost, attempt.tlsServerName, attempt.port);

    if (!transporter) {
      continue;
    }

    try {
      await transporter.sendMail({
        from: `${fromName} <${fromAddress}>`,
        to,
        subject,
        html,
        text
      });
      return;
    } catch (error) {
      lastError = error;

      const errorCode = (error as Error & { code?: string }).code ?? 'UNKNOWN';

      console.error('SMTP send attempt failed', {
        connectHost: attempt.connectHost,
        tlsServerName: attempt.tlsServerName,
        port: attempt.port,
        mode: attempt.mode,
        code: errorCode,
        message: error instanceof Error ? error.message : 'Unknown error',
        attempt: `${index + 1}/${attempts.length}`
      });

      if (!isConnectionLevelError(error)) {
        throw error;
      }
    }
  }

  if (lastError) {
    throw lastError;
  }

  throw new Error('SMTP transporter could not be created');
};
