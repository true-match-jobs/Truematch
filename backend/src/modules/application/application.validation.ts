import { z } from 'zod';

export const submitApplicationSchema = z
  .object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    applicationType: z.enum(['study_scholarship', 'work_employment']),
    dateOfBirth: z.string().min(1, 'Date of birth is required'),
    gender: z.string().min(1, 'Gender is required'),
    countryCode: z.string().min(1, 'Country code is required'),
    phoneNumber: z.string().min(1, 'Phone number is required'),
    nationality: z.string().min(1, 'Nationality is required'),
    countryOfResidence: z.string().min(1, 'Country of residence is required'),
    stateOrProvince: z.string().min(1, 'State / Province is required'),
    residentialAddress: z.string().min(1, 'Residential address is required'),
    passportNumber: z.string().min(1, 'Passport number is required'),
    passportExpiryDate: z.string().min(1, 'Passport expiry date is required'),
    skillOrProfession: z.string().optional(),
    workCountry: z.string().optional(),
    universityName: z.string().optional(),
    universityCountry: z.string().optional(),
    courseName: z.string().optional(),
    degreeType: z.string().optional(),
    studyMode: z.string().optional(),
    intake: z.string().optional(),
    email: z.string().email('Invalid email address').toLowerCase(),
    password: z.string().min(8, 'Password must be at least 8 characters')
  })
  .superRefine((data, ctx) => {
    if (data.applicationType === 'work_employment' && !data.skillOrProfession?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['skillOrProfession'],
        message: 'Skill or profession is required for work applications'
      });
    }

    if (data.applicationType === 'work_employment' && !data.workCountry?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['workCountry'],
        message: 'Work country is required for work applications'
      });
    }

    if (data.applicationType === 'study_scholarship') {
      const studyFields: Array<keyof Pick<
        typeof data,
        | 'universityName'
        | 'universityCountry'
        | 'courseName'
        | 'degreeType'
        | 'studyMode'
        | 'intake'
      >> = [
        'universityName',
        'universityCountry',
        'courseName',
        'degreeType',
        'studyMode',
        'intake'
      ];

      for (const field of studyFields) {
        if (!data[field]?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [field],
            message: 'This field is required for study applications'
          });
        }
      }
    }
  });

export type SubmitApplicationDto = z.infer<typeof submitApplicationSchema>;

export const reapplyApplicationSchema = z
  .object({
    applicationType: z.enum(['study_scholarship', 'work_employment']),
    skillOrProfession: z.string().optional(),
    workCountry: z.string().optional(),
    universityName: z.string().optional(),
    universityCountry: z.string().optional(),
    courseName: z.string().optional(),
    degreeType: z.string().optional(),
    studyMode: z.string().optional(),
    intake: z.string().optional()
  })
  .superRefine((data, ctx) => {
    if (data.applicationType === 'work_employment' && !data.skillOrProfession?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['skillOrProfession'],
        message: 'Skill or profession is required for work applications'
      });
    }

    if (data.applicationType === 'work_employment' && !data.workCountry?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['workCountry'],
        message: 'Work country is required for work applications'
      });
    }

    if (data.applicationType === 'study_scholarship') {
      const studyFields: Array<keyof Pick<
        typeof data,
        | 'universityName'
        | 'universityCountry'
        | 'courseName'
        | 'degreeType'
        | 'studyMode'
        | 'intake'
      >> = [
        'universityName',
        'universityCountry',
        'courseName',
        'degreeType',
        'studyMode',
        'intake'
      ];

      for (const field of studyFields) {
        if (!data[field]?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [field],
            message: 'This field is required for study applications'
          });
        }
      }
    }
  });

export type ReapplyApplicationDto = z.infer<typeof reapplyApplicationSchema>;

export const applicationDocumentTypeSchema = z.enum([
  'internationalPassport',
  'academicTranscripts',
  'degreeCertificates',
  'ieltsToeflCertificate',
  'statementOfPurpose',
  'curriculumVitae',
  'referenceLetters',
  'portfolio',
  'applicationFeeReceipt',
  'proofOfFunds'
]);

export type ApplicationDocumentType = z.infer<typeof applicationDocumentTypeSchema>;
