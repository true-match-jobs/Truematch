import { prisma } from '../../config/prisma';
import type { UploadApiResponse } from 'cloudinary';
import { cloudinary } from '../../config/cloudinary';
import { AppError } from '../../utils/app-error';
import { hashPassword } from '../../utils/hash';
import { sendEmailVerification } from '../auth/auth.service';
import { getAssignedAdminForUser } from '../chat/chat.service';
import type { UpdateUserProfileDto } from './user.validation';

export const getCurrentUser = async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      dateOfBirth: true,
      gender: true,
      countryCode: true,
      phoneNumber: true,
      nationality: true,
      countryOfResidence: true,
      stateOrProvince: true,
      residentialAddress: true,
      passportNumber: true,
      passportExpiryDate: true,
      emailVerifiedAt: true,
      profilePhotoUrl: true,
      hasVisitedDashboard: true,
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
      dateOfBirth: true,
      gender: true,
      countryCode: true,
      phoneNumber: true,
      nationality: true,
      countryOfResidence: true,
      stateOrProvince: true,
      residentialAddress: true,
      passportNumber: true,
      passportExpiryDate: true,
      emailVerifiedAt: true,
      profilePhotoUrl: true,
      hasVisitedDashboard: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      applications: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!user) {
    return null;
  }

  const latestApplication = user.applications[0] ?? null;

  if (user.role !== 'USER') {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      countryCode: user.countryCode,
      phoneNumber: user.phoneNumber,
      nationality: user.nationality,
      countryOfResidence: user.countryOfResidence,
      stateOrProvince: user.stateOrProvince,
      residentialAddress: user.residentialAddress,
      passportNumber: user.passportNumber,
      passportExpiryDate: user.passportExpiryDate,
      emailVerifiedAt: user.emailVerifiedAt,
      profilePhotoUrl: user.profilePhotoUrl,
      hasVisitedDashboard: user.hasVisitedDashboard,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      applications: user.applications,
      application: latestApplication,
      assignedAdmin: null
    };
  }

  const assignedAdmin = await getAssignedAdminForUser();

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    dateOfBirth: user.dateOfBirth,
    gender: user.gender,
    countryCode: user.countryCode,
    phoneNumber: user.phoneNumber,
    nationality: user.nationality,
    countryOfResidence: user.countryOfResidence,
    stateOrProvince: user.stateOrProvince,
    residentialAddress: user.residentialAddress,
    passportNumber: user.passportNumber,
    passportExpiryDate: user.passportExpiryDate,
    emailVerifiedAt: user.emailVerifiedAt,
    profilePhotoUrl: user.profilePhotoUrl,
    hasVisitedDashboard: user.hasVisitedDashboard,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    applications: user.applications,
    application: latestApplication,
    assignedAdmin
  };
};

const uploadProfilePhotoToCloudinary = async (file: Express.Multer.File): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'truematch/profile-photos',
        resource_type: 'image'
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

const userProfileApplicationFieldMap = {
  gender: 'gender',
  dateOfBirth: 'dateOfBirth',
  countryCode: 'countryCode',
  nationality: 'nationality',
  countryOfResidence: 'countryOfResidence',
  residentialAddress: 'residentialAddress',
  stateOrProvince: 'stateOrProvince',
  passportNumber: 'passportNumber',
  passportExpiryDate: 'passportExpiryDate',
  phoneNumber: 'phoneNumber'
} as const;

type ProfileApplicationField = keyof typeof userProfileApplicationFieldMap;

export const updateCurrentUserProfile = async (userId: string, payload: UpdateUserProfileDto) => {
  const { fullName, ...profileFieldsPayload } = payload;

  const updateData: Record<string, string> = {};

  if (typeof fullName === 'string') {
    updateData.fullName = fullName.trim();
  }

  const profileFieldEntries = Object.entries(profileFieldsPayload).filter(([, value]) => typeof value === 'string') as [
    ProfileApplicationField,
    string
  ][];

  for (const [key, value] of profileFieldEntries) {
    updateData[userProfileApplicationFieldMap[key]] = value;
  }

  if (Object.keys(updateData).length === 0) {
    throw new AppError(400, 'No valid fields to update');
  }

  await prisma.user.update({
    where: { id: userId },
    data: updateData
  });

  return getCurrentUserWithAllData(userId);
};

export const updateCurrentUserEmail = async (userId: string, email: string) => {
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true }
  });

  if (existing && existing.id !== userId) {
    throw new AppError(409, 'Email already exists');
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      email: normalizedEmail,
      emailVerifiedAt: null,
      emailVerificationTokenHash: null,
      emailVerificationTokenExpiresAt: null,
      emailVerificationLastSentAt: null
    }
  });

  try {
    await sendEmailVerification(userId);
  } catch (error) {
    console.error('Failed to send verification email after email update', error);
  }

  return getCurrentUserWithAllData(userId);
};

export const updateCurrentUserPassword = async (userId: string, password: string) => {
  const hashedPassword = await hashPassword(password);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  });

  return getCurrentUserWithAllData(userId);
};

export const updateCurrentUserProfilePhoto = async (userId: string, file: Express.Multer.File) => {
  const uploadResult = await uploadProfilePhotoToCloudinary(file);

  await prisma.user.update({
    where: { id: userId },
    data: {
      profilePhotoUrl: uploadResult.secure_url
    }
  });

  return getCurrentUserWithAllData(userId);
};

export const markCurrentUserDashboardVisited = async (userId: string) => {
  await prisma.user.update({
    where: { id: userId },
    data: {
      hasVisitedDashboard: true
    }
  });

  return getCurrentUserWithAllData(userId);
};
