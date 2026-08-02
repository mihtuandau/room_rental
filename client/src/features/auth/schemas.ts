import { z } from 'zod';

/** Mirrors the backend's VN_PHONE_REGEX so a valid form is rarely rejected. */
export const VN_PHONE = /^(0|\+84)(3|5|7|8|9)\d{8}$/;

export const loginSchema = z.object({
  phone: z.string().regex(VN_PHONE, 'Số điện thoại không hợp lệ.'),
  password: z
    .string()
    .min(8, 'Mật khẩu cần tối thiểu 8 ký tự.')
    .max(72, 'Mật khẩu tối đa 72 ký tự.'),
});

export const registerSchema = loginSchema
  .extend({
    // The backend accepts fullName 2–100 chars, optional.
    fullName: z
      .string()
      .min(2, 'Họ tên cần tối thiểu 2 ký tự.')
      .max(100, 'Họ tên tối đa 100 ký tự.')
      .optional()
      .or(z.literal('')),
    confirmPassword: z.string(),
    otpCode: z
      .string()
      .regex(/^\d{6}$/, 'Mã xác minh gồm 6 chữ số.'),
  })
  // There is no role picker at signup — any signed-in user can post a listing.
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Mật khẩu nhập lại không khớp.',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  phone: z.string().regex(VN_PHONE, 'Số điện thoại không hợp lệ.'),
});

export const resetPasswordSchema = z
  .object({
    // Backend expects exactly 6 digits (@IsNumberString @Length(6,6)).
    code: z.string().regex(/^\d{6}$/, 'Mã xác minh gồm 6 chữ số.'),
    newPassword: z
      .string()
      .min(8, 'Mật khẩu cần tối thiểu 8 ký tự.')
      .max(72, 'Mật khẩu tối đa 72 ký tự.'),
    confirmNewPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmNewPassword, {
    message: 'Mật khẩu nhập lại không khớp.',
    path: ['confirmNewPassword'],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
