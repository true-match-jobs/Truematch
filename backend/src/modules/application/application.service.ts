import { Prisma, type Application, type User } from '@prisma/client';
import type { UploadApiResponse } from 'cloudinary';
import { APPLICATION_STATUS, type ApplicationStatus } from '../../../../shared/applicationStatus';
import { cloudinary } from '../../config/cloudinary';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/app-error';
import { hashPassword } from '../../utils/hash';
import { signAccessToken, signRefreshToken } from '../../utils/jwt';
import { sendEmailVerification } from '../auth/auth.service';
import { addConversationMessage, getAssignedAdminForUser } from '../chat/chat.service';
import { pushNotificationToUser } from '../chat/websocket';
import { ensureRequiredActionNotificationsForUser } from '../notification/notification.service';
import type { ApplicationDocumentType, ReapplyApplicationDto, SubmitApplicationDto } from './application.validation';

const INITIAL_ONBOARDING_AUTOMATION_DELAY_MS = 10_000;

type SanitizedUser = Omit<User, 'password'>;
type ApplicationResult = {
  user: SanitizedUser;
  application: Application;
  accessToken: string;
  refreshToken: string;
};

const sanitizeUser = (user: User): SanitizedUser => {
  const { password: _password, ...safeUser } = user;
  return safeUser;
};

const documentFieldMap: Record<ApplicationDocumentType, keyof Application> = {
  internationalPassport: 'internationalPassportUrl',
  academicTranscripts: 'academicTranscriptsUrl',
  degreeCertificates: 'degreeCertificatesUrl',
  ieltsToeflCertificate: 'ieltsToeflCertificateUrl',
  statementOfPurpose: 'statementOfPurposeUrl',
  curriculumVitae: 'curriculumVitaeUrl',
  referenceLetters: 'referenceLettersUrl',
  portfolio: 'portfolioUrl',
  applicationFeeReceipt: 'applicationFeeReceiptUrl',
  proofOfFunds: 'proofOfFundsUrl'
};

const uploadBufferToCloudinary = async (file: Express.Multer.File): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'truematch/applications',
        resource_type: 'auto'
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Cloudinary upload failed'));
          return;
        }

        resolve(result);
      }
    );

    uploadStream.end(file.buffer);
  });
};

const isApplicationStatus = (value: string): value is ApplicationStatus => {
  return Object.values(APPLICATION_STATUS).some((status) => status === value);
};

const parseApplicationStatus = (value: string | null): ApplicationStatus | null => {
  if (!value) {
    return null;
  }

  if (isApplicationStatus(value)) {
    return value;
  }

  throw new AppError(500, 'Invalid application status in database');
};

const buildCountrySpecificOfferFields = (universityCountry?: string) => {
  const normalizedCountry = universityCountry?.trim().toLowerCase();

  if (normalizedCountry === 'united kingdom') {
    return { ukCasStatus: 'PENDING' };
  }

  if (normalizedCountry === 'australia') {
    return { australiaCoeStatus: 'PENDING' };
  }

  if (normalizedCountry === 'united states') {
    return { usaI20Status: 'PENDING' };
  }

  if (normalizedCountry === 'canada') {
    return { canadaLoaStatus: 'PENDING' };
  }

  return {};
};

const buildWelcomeMessage = (userFullName: string, adminFullName: string, applicationType: SubmitApplicationDto['applicationType']) => {
  const processLabel = applicationType === 'study_scholarship' ? 'study application process' : 'work application process';

  return `Hello ${userFullName},

My name is ${adminFullName}, and I am your assigned application advisor at Truematch.

I will be supporting you throughout your ${processLabel}, including guidance on documentation, progress updates, and next steps.

If you need assistance at any point, please send me a message here and I will be glad to help.`;
};

const scheduleInitialOnboardingAutomation = (
  userId: string,
  userFullName: string,
  applicationType: SubmitApplicationDto['applicationType']
): void => {
  setTimeout(() => {
    void (async () => {
      const assignedAdmin = await getAssignedAdminForUser();

      if (assignedAdmin) {
        try {
          await addConversationMessage(
            assignedAdmin.id,
            userId,
            buildWelcomeMessage(userFullName, assignedAdmin.fullName, applicationType)
          );
        } catch (_error) {
        }
      }

      const createdSystemNotifications = await ensureRequiredActionNotificationsForUser(userId);

      createdSystemNotifications.forEach((notification) => {
        pushNotificationToUser(userId, {
          type: 'notification',
          notification
        });
      });
    })().catch((_error) => {
    });
  }, INITIAL_ONBOARDING_AUTOMATION_DELAY_MS);
};

export const submitApplication = async (payload: SubmitApplicationDto): Promise<ApplicationResult> => {
  const existing = await prisma.user.findUnique({ where: { email: payload.email } });
  if (existing) {
    throw new AppError(409, 'Email already exists');
  }

  const hashedPassword = await hashPassword(payload.password);

  const { user, application } = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        fullName: payload.fullName,
        email: payload.email,
        dateOfBirth: payload.dateOfBirth,
        gender: payload.gender,
        countryCode: payload.countryCode,
        phoneNumber: payload.phoneNumber,
        nationality: payload.nationality,
        countryOfResidence: payload.countryOfResidence,
        stateOrProvince: payload.stateOrProvince,
        residentialAddress: payload.residentialAddress,
        passportNumber: payload.passportNumber,
        passportExpiryDate: payload.passportExpiryDate,
        password: hashedPassword,
        role: 'USER'
      }
    });

    const createdApplication = await tx.application.create({
      data: {
        userId: createdUser.id,
        applicationType: payload.applicationType,
        skillOrProfession: payload.skillOrProfession,
        workCountry: payload.workCountry,
        universityName: payload.universityName,
        universityCountry: payload.universityCountry,
        courseName: payload.courseName,
        degreeType: payload.degreeType,
        studyMode: payload.studyMode,
        intake: payload.intake,
        ...buildCountrySpecificOfferFields(payload.universityCountry),
        applicationStatus:
          payload.applicationType === 'study_scholarship' ? APPLICATION_STATUS.APPLICATION_PENDING : null
      }
    });

    return {
      user: createdUser,
      application: createdApplication
    };
  });

  const jwtPayload = { userId: user.id, email: user.email, role: user.role };

  scheduleInitialOnboardingAutomation(user.id, user.fullName, payload.applicationType);

  try {
    await sendEmailVerification(user.id);
  } catch (error) {
    console.error('Failed to send verification email after application submission', error);
  }

  return {
    user: sanitizeUser(user),
    application,
    accessToken: signAccessToken(jwtPayload),
    refreshToken: signRefreshToken(jwtPayload)
  };
};

export const reapplyApplication = async (
  userId: string,
  payload: ReapplyApplicationDto
): Promise<Application> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      dateOfBirth: true,
      gender: true,
      countryCode: true,
      phoneNumber: true,
      nationality: true,
      countryOfResidence: true,
      stateOrProvince: true,
      residentialAddress: true,
      passportNumber: true,
      passportExpiryDate: true
    }
  });

  if (!user || user.role !== 'USER') {
    throw new AppError(404, 'User not found');
  }

  const requiredUserFields: Array<
    keyof Pick<
      typeof user,
      | 'dateOfBirth'
      | 'gender'
      | 'countryCode'
      | 'phoneNumber'
      | 'nationality'
      | 'countryOfResidence'
      | 'stateOrProvince'
      | 'residentialAddress'
      | 'passportNumber'
      | 'passportExpiryDate'
    >
  > = [
    'dateOfBirth',
    'gender',
    'countryCode',
    'phoneNumber',
    'nationality',
    'countryOfResidence',
    'stateOrProvince',
    'residentialAddress',
    'passportNumber',
    'passportExpiryDate'
  ];

  const hasIncompleteProfile = requiredUserFields.some((field) => {
    const value = user[field];
    return typeof value !== 'string' || value.trim().length === 0;
  });

  if (hasIncompleteProfile) {
    throw new AppError(400, 'Personal profile is incomplete. Please update your profile before reapplying.');
  }

  const applicationData = {
    applicationType: payload.applicationType,
    skillOrProfession: payload.applicationType === 'work_employment' ? payload.skillOrProfession : null,
    workCountry: payload.applicationType === 'work_employment' ? payload.workCountry : null,
    universityName: payload.applicationType === 'study_scholarship' ? payload.universityName : null,
    universityCountry: payload.applicationType === 'study_scholarship' ? payload.universityCountry : null,
    courseName: payload.applicationType === 'study_scholarship' ? payload.courseName : null,
    degreeType: payload.applicationType === 'study_scholarship' ? payload.degreeType : null,
    studyMode: payload.applicationType === 'study_scholarship' ? payload.studyMode : null,
    intake: payload.applicationType === 'study_scholarship' ? payload.intake : null,
    ...buildCountrySpecificOfferFields(payload.applicationType === 'study_scholarship' ? payload.universityCountry : undefined),
    applicationStatus:
      payload.applicationType === 'study_scholarship' ? APPLICATION_STATUS.APPLICATION_PENDING : null
  };

  try {
    const createdApplication = await prisma.application.create({
      data: {
        userId,
        ...applicationData
      }
    });

    const createdSystemNotifications = await ensureRequiredActionNotificationsForUser(userId);

    createdSystemNotifications.forEach((notification) => {
      pushNotificationToUser(userId, {
        type: 'notification',
        notification
      });
    });

    return createdApplication;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AppError(409, 'Reapply is blocked by a legacy unique application constraint. Apply latest migrations.');
    }

    throw error;
  }
};

export type ApplicationStatusRecord = {
  id: string;
  userId: string;
  applicationType: string;
  universityName: string | null;
  universityCountry: string | null;
  applicationStatus: ApplicationStatus | null;
};

export type ApplicationStatusResponse = {
  id: string;
  applicationStatus: ApplicationStatus;
};

export type TrackerViewedResponse = {
  id: string;
  hasViewedTracker: boolean;
};

export type AdminApplicationListItem = {
  id: string;
  applicationType: string;
  hasAdminViewed: boolean;
  universityName: string | null;
  courseName: string | null;
  skillOrProfession: string | null;
  workCountry: string | null;
  intake: string | null;
  createdAt: Date;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
};

export type AdminApplicationDetails = {
  id: string;
  applicationType: string;
  applicationStatus: ApplicationStatus | null;
  countryOfResidence: string;
  workCountry: string | null;
  internationalPassportUrl: string | null;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
};

export const getAllApplicationsForAdmin = async (): Promise<AdminApplicationListItem[]> => {
  return prisma.application.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      id: true,
      applicationType: true,
      hasAdminViewed: true,
      universityName: true,
      courseName: true,
      skillOrProfession: true,
      workCountry: true,
      intake: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          fullName: true,
          email: true
        }
      }
    }
  });
};

export const getApplicationDetailsForAdmin = async (applicationId: string): Promise<AdminApplicationDetails | null> => {
  const applicationExists = await prisma.application.findUnique({
    where: { id: applicationId },
    select: { id: true }
  });

  if (!applicationExists) {
    return null;
  }

  const application = await prisma.application.update({
    where: { id: applicationId },
    data: {
      hasAdminViewed: true
    },
    select: {
      id: true,
      applicationType: true,
      applicationStatus: true,
      status: true,
      workCountry: true,
      internationalPassportUrl: true,
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          countryOfResidence: true
        }
      }
    }
  });

  return {
    ...application,
    countryOfResidence: application.user.countryOfResidence ?? 'N/A',
    applicationStatus:
      application.applicationType === 'study_scholarship'
        ? parseApplicationStatus(application.applicationStatus)
        : null
  };
};

export const getApplicationStatusById = async (applicationId: string): Promise<ApplicationStatusRecord | null> => {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    select: {
      id: true,
      userId: true,
      applicationType: true,
      universityName: true,
      universityCountry: true,
      applicationStatus: true
    }
  });

  if (!application) {
    return null;
  }

  return {
    id: application.id,
    userId: application.userId,
    applicationType: application.applicationType,
    universityName: application.universityName,
    universityCountry: application.universityCountry,
    applicationStatus:
      application.applicationType === 'study_scholarship'
        ? parseApplicationStatus(application.applicationStatus)
        : null
  };
};

export const updateApplicationStatusById = async (
  applicationId: string,
  applicationStatus: ApplicationStatus
): Promise<ApplicationStatusResponse> => {
  const existing = await prisma.application.findUnique({
    where: { id: applicationId },
    select: { id: true, applicationType: true }
  });

  if (!existing) {
    throw new AppError(404, 'Application not found');
  }

  if (existing.applicationType !== 'study_scholarship') {
    throw new AppError(400, 'Application status is only available for study applications');
  }

  const updatedApplication = await prisma.application.update({
    where: { id: applicationId },
    data: { applicationStatus },
    select: {
      id: true,
      applicationStatus: true
    }
  });

  return {
    id: updatedApplication.id,
    applicationStatus
  };
};

export const uploadApplicationDocumentByType = async (params: {
  applicationId: string;
  userId: string;
  documentType: ApplicationDocumentType;
  file: Express.Multer.File;
}): Promise<Application> => {
  const application = await prisma.application.findUnique({ where: { id: params.applicationId } });

  if (!application) {
    throw new AppError(404, 'Application not found');
  }

  if (application.userId !== params.userId) {
    throw new AppError(403, 'Forbidden');
  }

  const uploadedFile = await uploadBufferToCloudinary(params.file);
  const targetField = documentFieldMap[params.documentType];

  return prisma.application.update({
    where: { id: params.applicationId },
    data: {
      [targetField]: uploadedFile.secure_url
    }
  });
};

export const markApplicationTrackerViewed = async (
  applicationId: string,
  userId: string
): Promise<TrackerViewedResponse> => {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    select: {
      id: true,
      userId: true,
      applicationType: true
    }
  });

  if (!application) {
    throw new AppError(404, 'Application not found');
  }

  if (application.userId !== userId) {
    throw new AppError(403, 'Forbidden');
  }

  if (application.applicationType !== 'study_scholarship') {
    throw new AppError(400, 'Tracker is available for study applications only');
  }

  const updatedApplication = await prisma.application.update({
    where: { id: applicationId },
    data: {
      hasViewedTracker: true
    },
    select: {
      id: true,
      hasViewedTracker: true
    }
  });

  return {
    id: updatedApplication.id,
    hasViewedTracker: updatedApplication.hasViewedTracker
  };
};

export const deleteApplicationById = async (applicationId: string, userId: string): Promise<void> => {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    select: {
      id: true,
      userId: true
    }
  });

  if (!application) {
    throw new AppError(404, 'Application not found');
  }

  if (application.userId !== userId) {
    throw new AppError(403, 'Forbidden');
  }

  await prisma.application.delete({
    where: { id: applicationId }
  });
};

export const deleteApplicationByIdForAdmin = async (applicationId: string): Promise<void> => {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    select: {
      id: true
    }
  });

  if (!application) {
    throw new AppError(404, 'Application not found');
  }

  await prisma.application.delete({
    where: { id: applicationId }
  });
};
