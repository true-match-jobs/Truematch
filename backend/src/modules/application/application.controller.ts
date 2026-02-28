import type { Request, Response } from 'express';
import { APPLICATION_STATUS, type ApplicationStatus } from '../../../../shared/applicationStatus';
import { AppError } from '../../utils/app-error';
import { setAuthCookies } from '../../utils/jwt';
import {
  getAllApplicationsForAdmin,
  getApplicationDetailsForAdmin,
  getApplicationStatusById,
  markApplicationTrackerViewed,
  submitApplication,
  updateApplicationStatusById,
  uploadApplicationDocumentByType
} from './application.service';
import { applicationDocumentTypeSchema, submitApplicationSchema } from './application.validation';

const ADMIN_UPDATABLE_APPLICATION_STATUSES: ApplicationStatus[] = [
  APPLICATION_STATUS.SUBMITTED_TO_UNIVERSITY,
  APPLICATION_STATUS.UNDER_REVIEW,
  APPLICATION_STATUS.OFFER_ISSUED
];

const isApplicationStatus = (value: unknown): value is ApplicationStatus => {
  return typeof value === 'string' && Object.values(APPLICATION_STATUS).some((status) => status === value);
};

export const submitApplicationHandler = async (req: Request, res: Response): Promise<void> => {
  const dto = submitApplicationSchema.parse(req.body);
  const result = await submitApplication(dto);

  setAuthCookies(res, result.accessToken, result.refreshToken);

  res.status(201).json({
    message: 'Application submitted successfully',
    user: result.user,
    application: result.application
  });
};

export const uploadApplicationDocumentHandler = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError(401, 'Unauthorized');
  }

  if (!req.file) {
    throw new AppError(400, 'A file is required');
  }

  const applicationId = Array.isArray(req.params.applicationId)
    ? req.params.applicationId[0]
    : req.params.applicationId;

  if (!applicationId) {
    throw new AppError(400, 'Application id is required');
  }

  const documentType = applicationDocumentTypeSchema.parse(req.params.documentType);

  const application = await uploadApplicationDocumentByType({
    applicationId,
    userId: req.user.userId,
    documentType,
    file: req.file
  });

  res.status(200).json({
    message: 'Document uploaded successfully',
    application
  });
};

export const getApplicationByIdHandler = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError(401, 'Unauthorized');
  }

  const applicationId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  if (!applicationId) {
    throw new AppError(400, 'Application id is required');
  }

  const application = await getApplicationStatusById(applicationId);

  if (!application) {
    throw new AppError(404, 'Application not found');
  }

  if (req.user.role !== 'ADMIN' && application.userId !== req.user.userId) {
    throw new AppError(403, 'Forbidden');
  }

  res.status(200).json({
    id: application.id,
    universityName: application.universityName,
    applicationStatus: application.applicationStatus
  });
};

export const getApplicationTrackerByIdHandler = async (req: Request, res: Response): Promise<void> => {
  const applicationId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  if (!applicationId) {
    throw new AppError(400, 'Application id is required');
  }

  const application = await getApplicationStatusById(applicationId);

  if (!application) {
    throw new AppError(404, 'Application not found');
  }

  res.status(200).json({
    id: application.id,
    applicationStatus: application.applicationStatus
  });
};

export const updateApplicationStatusHandler = async (req: Request, res: Response): Promise<void> => {
  const applicationId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  if (!applicationId) {
    throw new AppError(400, 'Application id is required');
  }

  const { applicationStatus } = req.body as { applicationStatus?: unknown };

  if (!isApplicationStatus(applicationStatus)) {
    throw new AppError(400, 'Invalid status value');
  }

  if (!ADMIN_UPDATABLE_APPLICATION_STATUSES.includes(applicationStatus)) {
    throw new AppError(400, 'Invalid status value');
  }

  const updatedApplication = await updateApplicationStatusById(applicationId, applicationStatus);

  res.status(200).json(updatedApplication);
};

export const getAllApplicationsForAdminHandler = async (_req: Request, res: Response): Promise<void> => {
  const applications = await getAllApplicationsForAdmin();

  res.status(200).json({ applications });
};

export const getApplicationDetailsForAdminHandler = async (req: Request, res: Response): Promise<void> => {
  const applicationId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  if (!applicationId) {
    throw new AppError(400, 'Application id is required');
  }

  const application = await getApplicationDetailsForAdmin(applicationId);

  if (!application) {
    throw new AppError(404, 'Application not found');
  }

  res.status(200).json({ application });
};

export const markApplicationTrackerViewedHandler = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError(401, 'Unauthorized');
  }

  const applicationId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  if (!applicationId) {
    throw new AppError(400, 'Application id is required');
  }

  const result = await markApplicationTrackerViewed(applicationId, req.user.userId);

  res.status(200).json(result);
};
