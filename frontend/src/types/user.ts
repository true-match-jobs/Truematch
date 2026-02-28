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
  | 'offerLetter'
  | 'casLetter'
  | 'visaDecisionLetter'
  | 'proofOfFunds';

export type Application = {
  id: string;
  userId: string;
  applicationType: 'study_scholarship' | 'work_employment';
  dateOfBirth: string;
  gender: string;
  countryCode: string;
  phoneNumber: string;
  nationality: string;
  countryOfResidence: string;
  stateOrProvince: string;
  residentialAddress: string;
  passportNumber: string;
  passportExpiryDate: string;
  skillOrProfession: string | null;
  universityName: string | null;
  universityCountry: string | null;
  courseName: string | null;
  degreeType: string | null;
  studyMode: string | null;
  intake: string | null;
  applicationDate: string | null;
  internationalPassportUrl: string | null;
  academicTranscriptsUrl: string | null;
  degreeCertificatesUrl: string | null;
  ieltsToeflCertificateUrl: string | null;
  statementOfPurposeUrl: string | null;
  curriculumVitaeUrl: string | null;
  referenceLettersUrl: string | null;
  portfolioUrl: string | null;
  applicationFeeReceiptUrl: string | null;
  offerLetterUrl: string | null;
  casLetterUrl: string | null;
  visaDecisionLetterUrl: string | null;
  proofOfFundsUrl: string | null;
  hasViewedTracker: boolean;
  applicationStatus: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
};

export type User = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};

export type AssignedAdmin = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};

export type UserWithApplication = User & {
  application: Application | null;
  assignedAdmin: AssignedAdmin | null;
  hasUploadedPassport: boolean;
};
