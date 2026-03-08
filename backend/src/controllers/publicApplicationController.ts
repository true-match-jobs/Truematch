import type { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/app-error';

export const getPublicApplicationByIdHandler = async (req: Request, res: Response): Promise<void> => {
  const applicationId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  if (!applicationId) {
    throw new AppError(400, 'Application id is required');
  }

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    select: {
      id: true,
      skillOrProfession: true,
      workCountry: true,
      user: {
        select: {
          fullName: true,
          nationality: true,
          passportNumber: true
        }
      }
    }
  });

  if (!application) {
    throw new AppError(404, 'Application not found');
  }

  res.status(200).json({
    application_id: application.id,
    full_name: application.user.fullName,
    nationality: application.user.nationality,
    passport_number: application.user.passportNumber,
    skill_or_profession: application.skillOrProfession,
    work_country: application.workCountry
  });
};
