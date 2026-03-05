import { z } from 'zod';

export const updateUserProfileSchema = z
  .object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
    gender: z.string().min(1).optional(),
    dateOfBirth: z.string().min(1).optional(),
    countryCode: z.string().min(1).optional(),
    nationality: z.string().min(1).optional(),
    countryOfResidence: z.string().min(1).optional(),
    residentialAddress: z.string().min(1).optional(),
    stateOrProvince: z.string().min(1).optional(),
    passportNumber: z.string().min(1).optional(),
    passportExpiryDate: z.string().min(1).optional(),
    phoneNumber: z.string().min(1).optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required'
  });

export const updateUserEmailSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase()
});

export const updateUserPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters')
});

export type UpdateUserProfileDto = z.infer<typeof updateUserProfileSchema>;
export type UpdateUserEmailDto = z.infer<typeof updateUserEmailSchema>;
export type UpdateUserPasswordDto = z.infer<typeof updateUserPasswordSchema>;