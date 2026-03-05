import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  errorFormat: process.env.NODE_ENV === 'production' ? 'minimal' : 'pretty'
});
