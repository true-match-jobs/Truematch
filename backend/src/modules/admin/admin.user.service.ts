import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/app-error';

export type AdminUserListItem = {
  id: string;
  fullName: string;
  email: string;
  emailVerifiedAt: Date | null;
  hasVisitedDashboard: boolean;
  createdAt: Date;
  applicationsCount: number;
};

export const getAllUsersForAdmin = async (): Promise<AdminUserListItem[]> => {
  const users = await prisma.user.findMany({
    where: {
      role: 'USER'
    },
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      emailVerifiedAt: true,
      hasVisitedDashboard: true,
      createdAt: true,
      _count: {
        select: {
          applications: true
        }
      }
    }
  });

  return users.map((user) => ({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    emailVerifiedAt: user.emailVerifiedAt,
    hasVisitedDashboard: user.hasVisitedDashboard,
    createdAt: user.createdAt,
    applicationsCount: user._count.applications
  }));
};

export const deleteUserByIdForAdmin = async (userId: string): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true
    }
  });

  if (!user || user.role !== 'USER') {
    throw new AppError(404, 'User not found');
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.application.deleteMany({
      where: { userId }
    });

    await transaction.user.delete({
      where: { id: userId }
    });
  });
};
