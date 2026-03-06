import type { Request, Response } from 'express';
import { AppError } from '../../utils/app-error';
import { pushNotificationToUser } from '../chat/websocket';
import {
  clearMyNotificationsHandler,
  getMyNotificationsHandler,
  markMyNotificationReadHandler,
  getMyUnreadNotificationCountHandler,
  markMyNotificationsReadHandler
} from '../notification/notification.controller';
import { ensureRequiredActionNotificationsForUser } from '../notification/notification.service';
import {
  getCurrentUser,
  getCurrentUserWithAllData,
  markCurrentUserDashboardVisited,
  updateCurrentUserEmail,
  updateCurrentUserPassword,
  updateCurrentUserProfile,
  updateCurrentUserProfilePhoto
} from './user.service';
import { updateUserEmailSchema, updateUserPasswordSchema, updateUserProfileSchema } from './user.validation';

const resolveOfferPresentation = (universityCountry?: string | null) => {
  const normalizedCountry = universityCountry?.trim().toLowerCase();
  const isCanada = normalizedCountry === 'canada';
  const isUnitedStates = normalizedCountry === 'united states';

  return {
    shouldShowOfferFields: !isCanada,
    offerTypeLabel: isUnitedStates ? 'Admission Letter' : 'Offer Type',
    offerDateLabel: isUnitedStates ? 'Admission Letter Date' : 'Offer Date'
  };
};

const applyOfferPresentation = <T extends { universityCountry?: string | null }>(application: T) => {
  const offerPresentation = resolveOfferPresentation(application.universityCountry);

  return {
    ...application,
    ...offerPresentation
  };
};

const APPLICATION_DOCUMENT_UPLOAD_FIELDS = [
  'internationalPassportUrl',
  'academicTranscriptsUrl',
  'degreeCertificatesUrl',
  'ieltsToeflCertificateUrl',
  'statementOfPurposeUrl',
  'curriculumVitaeUrl',
  'referenceLettersUrl',
  'portfolioUrl',
  'applicationFeeReceiptUrl',
  'proofOfFundsUrl'
] as const;

const hasUploadedAnyDocument = (application: Record<string, unknown>) =>
  APPLICATION_DOCUMENT_UPLOAD_FIELDS.some((field) => Boolean(application[field]));

const serializeUserWithAllData = (user: NonNullable<Awaited<ReturnType<typeof getCurrentUserWithAllData>>>) => {
  const resolvedApplications = user.applications.map((application) => applyOfferPresentation(application));

  const resolvedApplication = user.application
    ? applyOfferPresentation(user.application)
    : null;

  const hasUploadedAnyApplicationDocument = resolvedApplications.some((application) => hasUploadedAnyDocument(application));
  const hasUploadedAnyLegacyApplicationDocument = resolvedApplication ? hasUploadedAnyDocument(resolvedApplication) : false;
  const hasUploadedAnyDocumentFlag = hasUploadedAnyApplicationDocument || hasUploadedAnyLegacyApplicationDocument;

  return {
    ...user,
    applications: resolvedApplications,
    application: resolvedApplication,
    hasUploadedAnyDocument: hasUploadedAnyDocumentFlag
  };
};

export const meHandler = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError(401, 'Unauthorized');
  }

  const user = await getCurrentUser(req.user.userId);

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  res.status(200).json({ user });
};

export const meAllDataHandler = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError(401, 'Unauthorized');
  }

  const createdSystemNotifications = await ensureRequiredActionNotificationsForUser(req.user.userId);

  createdSystemNotifications.forEach((notification) => {
    pushNotificationToUser(req.user!.userId, {
      type: 'notification',
      notification
    });
  });

  const user = await getCurrentUserWithAllData(req.user.userId);

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  res.status(200).json({
    user: serializeUserWithAllData(user)
  });
};

export const updateMeProfileHandler = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError(401, 'Unauthorized');
  }

  const dto = updateUserProfileSchema.parse(req.body);
  const user = await updateCurrentUserProfile(req.user.userId, dto);

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  res.status(200).json({
    message: 'Profile updated successfully',
    user: serializeUserWithAllData(user)
  });
};

export const updateMeProfilePhotoHandler = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError(401, 'Unauthorized');
  }

  if (!req.file) {
    throw new AppError(400, 'An image file is required');
  }

  const user = await updateCurrentUserProfilePhoto(req.user.userId, req.file);

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  res.status(200).json({
    message: 'Profile photo updated successfully',
    user: serializeUserWithAllData(user)
  });
};

export const updateMeEmailHandler = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError(401, 'Unauthorized');
  }

  const dto = updateUserEmailSchema.parse(req.body);
  const user = await updateCurrentUserEmail(req.user.userId, dto.email);

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  res.status(200).json({
    message: 'Email updated successfully',
    user: serializeUserWithAllData(user)
  });
};

export const updateMePasswordHandler = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError(401, 'Unauthorized');
  }

  const dto = updateUserPasswordSchema.parse(req.body);
  const user = await updateCurrentUserPassword(req.user.userId, dto.password);

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  res.status(200).json({
    message: 'Password updated successfully',
    user: serializeUserWithAllData(user)
  });
};

export const markMeDashboardVisitedHandler = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError(401, 'Unauthorized');
  }

  const user = await markCurrentUserDashboardVisited(req.user.userId);

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  res.status(200).json({
    message: 'Dashboard visit marked successfully',
    user: serializeUserWithAllData(user)
  });
};

export {
  clearMyNotificationsHandler,
  getMyNotificationsHandler,
  markMyNotificationReadHandler,
  getMyUnreadNotificationCountHandler,
  markMyNotificationsReadHandler
};
