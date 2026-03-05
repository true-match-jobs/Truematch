import type { Request, Response } from 'express';
import { AppError } from '../../utils/app-error';
import { deleteUserByIdForAdmin, getAllUsersForAdmin } from './admin.user.service';

export const getAllUsersForAdminHandler = async (_req: Request, res: Response): Promise<void> => {
  const users = await getAllUsersForAdmin();

  res.status(200).json({ users });
};

export const deleteUserForAdminHandler = async (req: Request, res: Response): Promise<void> => {
  const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  if (!userId) {
    throw new AppError(400, 'User id is required');
  }

  await deleteUserByIdForAdmin(userId);

  res.status(200).json({ message: 'User deleted successfully' });
};
