import { z } from 'zod';
import { INDIA_PHONE_REGEX } from '../constants';

export const IndianPhoneSchema = z
  .string()
  .trim()
  .regex(INDIA_PHONE_REGEX, 'Enter a valid Indian mobile number (10 digits, starting with 6-9)')
  .transform((val) => {
    const digits = val.replace(/\D/g, '');
    return digits.length === 10 ? `+91${digits}` : `+${digits}`;
  });

export const OtpSchema = z
  .string()
  .length(6, 'OTP must be exactly 6 digits')
  .regex(/^\d+$/, 'OTP must contain only digits');

export const SendOtpSchema = z.object({
  phone: IndianPhoneSchema,
});

export const VerifyOtpSchema = z.object({
  phone: IndianPhoneSchema,
  otp: OtpSchema,
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const BusinessProfileSchema = z.object({
  name: z.string().min(2).max(100),
  industry: z.enum(['RESTAURANT', 'SALON', 'CLINIC', 'TUITION', 'SHOP', 'OTHER']),
  settings: z.record(z.unknown()).optional(),
});

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type SendOtpInput = z.infer<typeof SendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;
export type BusinessProfileInput = z.infer<typeof BusinessProfileSchema>;
export type PaginationInput = z.infer<typeof PaginationSchema>;
