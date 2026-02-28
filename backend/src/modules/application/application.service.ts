import type { Application, User } from '@prisma/client';
import type { UploadApiResponse } from 'cloudinary';
import { APPLICATION_STATUS, type ApplicationStatus } from '../../../../shared/applicationStatus';
import { cloudinary } from '../../config/cloudinary';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/app-error';
import { hashPassword } from '../../utils/hash';
import { signAccessToken, signRefreshToken } from '../../utils/jwt';
import type { ApplicationDocumentType, SubmitApplicationDto } from './application.validation';

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
  offerLetter: 'offerLetterUrl',
  casLetter: 'casLetterUrl',
  visaDecisionLetter: 'visaDecisionLetterUrl',
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

const parseApplicationStatus = (value: string): ApplicationStatus => {
  if (isApplicationStatus(value)) {
    return value;
  }

  throw new AppError(500, 'Invalid application status in database');
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
        password: hashedPassword,
        role: 'USER'
      }
    });

    const createdApplication = await tx.application.create({
      data: {
        userId: createdUser.id,
        applicationType: payload.applicationType,
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
        skillOrProfession: payload.skillOrProfession,
        universityName: payload.universityName,
        universityCountry: payload.universityCountry,
        courseName: payload.courseName,
        degreeType: payload.degreeType,
        studyMode: payload.studyMode,
        intake: payload.intake,
        applicationDate: payload.applicationDate,
        applicationStatus: APPLICATION_STATUS.SUBMITTED_TO_UNIVERSITY
      }
    });

    return {
      user: createdUser,
      application: createdApplication
    };
  });

  const jwtPayload = { userId: user.id, email: user.email, role: user.role };

  return {
    user: sanitizeUser(user),
    application,
    accessToken: signAccessToken(jwtPayload),
    refreshToken: signRefreshToken(jwtPayload)
  };
};

export type ApplicationStatusRecord = {
  id: string;
  userId: string;
  universityName: string | null;
  applicationStatus: ApplicationStatus;
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
  universityName: string | null;
  courseName: string | null;
  skillOrProfession: string | null;
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
  applicationStatus: ApplicationStatus;
  countryOfResidence: string;
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
      universityName: true,
      courseName: true,
      skillOrProfession: true,
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
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    select: {
      id: true,
      applicationType: true,
      applicationStatus: true,
      status: true,
      countryOfResidence: true,
      internationalPassportUrl: true,
      user: {
        select: {
          id: true,
          fullName: true,
          email: true
        }
      }
    }
  });

  if (!application) {
    return null;
  }

  return {
    ...application,
    applicationStatus: parseApplicationStatus(application.applicationStatus)
  };
};

export const getApplicationStatusById = async (applicationId: string): Promise<ApplicationStatusRecord | null> => {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    select: {
      id: true,
      userId: true,
      universityName: true,
      applicationStatus: true
    }
  });

  if (!application) {
    return null;
  }

  return {
    id: application.id,
    userId: application.userId,
    universityName: application.universityName,
    applicationStatus: parseApplicationStatus(application.applicationStatus)
  };
};

export const updateApplicationStatusById = async (
  applicationId: string,
  applicationStatus: ApplicationStatus
): Promise<ApplicationStatusResponse> => {
  const existing = await prisma.application.findUnique({
    where: { id: applicationId },
    select: { id: true }
  });

  if (!existing) {
    throw new AppError(404, 'Application not found');
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
      userId: true
    }
  });

  if (!application) {
    throw new AppError(404, 'Application not found');
  }

  if (application.userId !== userId) {
    throw new AppError(403, 'Forbidden');
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
