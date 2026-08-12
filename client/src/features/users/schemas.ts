import { z } from 'zod';
import { VN_PHONE } from '@/features/auth/schemas';

export const updateProfileSchema = z.object({
  // Matches the backend's fullName rule (2-100 chars), but stays optional and
  // accepts '' so a user can leave it blank without tripping validation.
  fullName: z
    .string()
    .min(2, 'Họ tên cần tối thiểu 2 ký tự.')
    .max(100, 'Họ tên tối đa 100 ký tự.')
    .optional()
    .or(z.literal('')),
  // Shown to tenants on a listing — may differ from the login phone, so it's
  // optional here even though the login phone itself can't be blank.
  contactPhone: z
    .string()
    .regex(VN_PHONE, 'Số điện thoại không hợp lệ.')
    .optional()
    .or(z.literal('')),
  zaloUrl: z
    .string()
    .url('Đường dẫn Zalo không hợp lệ.')
    .optional()
    .or(z.literal('')),
});

export const listingContactSetupSchema = z.object({
  contactPhone: z
    .string()
    .trim()
    .regex(VN_PHONE, 'Số điện thoại không hợp lệ.'),
});

export const listingContactOtpSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Mã xác minh gồm 6 chữ số.'),
});

export type UpdateProfileFormInput = z.infer<typeof updateProfileSchema>;
export type ListingContactSetupInput = z.infer<
  typeof listingContactSetupSchema
>;
export type ListingContactOtpInput = z.infer<typeof listingContactOtpSchema>;
