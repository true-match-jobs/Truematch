import type { ApplicationStatus } from '../../../shared/applicationStatus';

export type UserRole = 'USER' | 'ADMIN';

export type ApplicationDocumentType =
  | 'internationalPassport'
  | 'academicTranscripts'
  | 'degreeCertificates'
  | 'ieltsToeflCertificate'
  | 'statementOfPurpose'
  | 'curriculumVitae'
  | 'referenceLetters'
  | 'portfolio'
  | 'applicationFeeReceipt'
  | 'proofOfFunds';

export type Application = {
  id: string;
  userId: string;
  applicationType: 'study_scholarship' | 'work_employment';
  skillOrProfession: string | null;
  workCountry: string | null;
  universityName: string | null;
  universityCountry: string | null;
  courseName: string | null;
  degreeType: string | null;
  studyMode: string | null;
  intake: string | null;
  internationalPassportUrl: string | null;
  academicTranscriptsUrl: string | null;
  degreeCertificatesUrl: string | null;
  ieltsToeflCertificateUrl: string | null;
  statementOfPurposeUrl: string | null;
  curriculumVitaeUrl: string | null;
  referenceLettersUrl: string | null;
  portfolioUrl: string | null;
  applicationFeeReceiptUrl: string | null;
  proofOfFundsUrl: string | null;
  ukCasStatus: string | null;
  australiaCoeStatus: string | null;
  usaI20Status: string | null;
  canadaLoaStatus: string | null;
  shouldShowOfferFields?: boolean;
  offerTypeLabel?: string;
  offerDateLabel?: string;
  hasViewedTracker: boolean;
  applicationStatus: ApplicationStatus | null;
  createdAt: string;
  updatedAt: string;
};

export type User = {
  id: string;
  fullName: string;
  email: string;
  dateOfBirth: string | null;
  gender: string | null;
  countryCode: string | null;
  phoneNumber: string | null;
  nationality: string | null;
  countryOfResidence: string | null;
  stateOrProvince: string | null;
  residentialAddress: string | null;
  passportNumber: string | null;
  passportExpiryDate: string | null;
  emailVerifiedAt: string | null;
  profilePhotoUrl: string | null;
  hasVisitedDashboard: boolean;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};

export type AssignedAdmin = {
  id: string;
  fullName: string;
  email: string;
  profilePhotoUrl: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};

export type UserWithApplication = User & {
  applications: Application[];
  application: Application | null;
  assignedAdmin: AssignedAdmin | null;
  hasUploadedAnyDocument: boolean;
};
