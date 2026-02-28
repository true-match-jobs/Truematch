import { prisma } from '../../config/prisma';
import { getAssignedAdminForUser } from '../chat/chat.service';

export const getCurrentUser = async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true
    }
  });
};

export const getCurrentUserWithAllData = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      application: true
    }
  });

  if (!user) {
    return null;
  }

  if (user.role !== 'USER') {
    return {
      ...user,
      assignedAdmin: null
    };
  }

  const assignedAdmin = await getAssignedAdminForUser();

  return {
    ...user,
    assignedAdmin
  };
};
