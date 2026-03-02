import type { Request, Response } from 'express';
import { AppError } from '../../utils/app-error';
import { saveNavbarLogo } from './admin.logo.service';

export const uploadNavbarLogoHandler = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError(401, 'Unauthorized');
  }

  if (!req.file) {
    throw new AppError(400, 'Logo file is required');
  }

  const publicUrl = await saveNavbarLogo(req.file);

  res.status(200).json({
    message: 'Logo saved successfully',
    logoUrl: publicUrl
  });
};
