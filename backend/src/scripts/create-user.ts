import type { UserRole } from '@prisma/client';
import { prisma } from '../config/prisma';
import { hashPassword } from '../utils/hash';

type ScriptArgs = {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
};

const parseArgs = (): ScriptArgs => {
  const args = process.argv.slice(2);

  const getArgValue = (name: string): string | undefined => {
    const prefixed = `--${name}=`;
    const inline = args.find((entry) => entry.startsWith(prefixed));
    if (inline) {
      return inline.slice(prefixed.length).trim();
    }

    const index = args.findIndex((entry) => entry === `--${name}`);
    if (index >= 0) {
      return args[index + 1]?.trim();
    }

    return undefined;
  };

  const fullName = getArgValue('fullName');
  const email = getArgValue('email');
  const password = getArgValue('password');
  const roleInput = getArgValue('role');

  if (!fullName || !email || !password || !roleInput) {
    throw new Error(
      'Usage: npm run user:create -- --fullName="<full name>" --email=<email> --password=<password> --role=<ADMIN|USER>'
    );
  }

  const normalizedRole = roleInput.toUpperCase();
  if (normalizedRole !== 'ADMIN' && normalizedRole !== 'USER') {
    throw new Error('Invalid role. Allowed roles: ADMIN, USER');
  }

  return {
    fullName,
    email: email.toLowerCase(),
    password,
    role: normalizedRole
  };
};

const run = async (): Promise<void> => {
  const { fullName, email, password, role } = parseArgs();

  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  const hashedPassword = await hashPassword(password);
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role
    },
    create: {
      fullName,
      email,
      password: hashedPassword,
      role
    }
  });

  console.log(`User ready: ${user.email} (${user.role})`);
};

void run()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to create/update user: ${message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });