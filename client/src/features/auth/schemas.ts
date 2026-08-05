import { z } from 'zod';

/** Mirrors the backend's VN_PHONE_REGEX so a valid form is rarely rejected. */
export const VN_PHONE = /^(0|\+84)(3|5|7|8|9)\d{8}$/;
export const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}$/;

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Nhập email hoặc số điện thoại.'),
  password: z
    .string()
    .min(8, 'Mật khẩu cần tối thiểu 8 ký tự.')
    .max(72, 'Mật khẩu tối đa 72 ký tự.'),
});

const registerBaseSchema = loginSchema
  .extend({
    identifier: z.string().email('Nhập email hợp lệ để nhận mã xác minh.'),
    password: z
      .string()
      .min(8, 'Mật khẩu cần tối thiểu 8 ký tự.')
      .max(72, 'Mật khẩu tối đa 72 ký tự.')
      .regex(STRONG_PASSWORD, 'Mật khẩu cần có chữ hoa, chữ thường và số.'),
    // The backend accepts fullName 2–100 chars, optional.
    fullName: z
      .string()
      .min(2, 'Họ tên cần tối thiểu 2 ký tự.')
      .max(100, 'Họ tên tối đa 100 ký tự.')
      .optional()
      .or(z.literal('')),
    otpCode: z
      .string()
      .regex(/^\d{6}$/, 'Mã xác minh gồm 6 chữ số.'),
  });

export const registerSchema = registerBaseSchema.safeExtend({
  identifier: z.string().refine(
    (value) =>
      z.string().email().safeParse(value.trim()).success ||
      VN_PHONE.test(value.trim()),
    'Nhập email hoặc số điện thoại hợp lệ.',
  ),
});

export const forgotPasswordSchema = z.object({
  identifier: z.string().email('Nhập email đã đăng ký.'),
});

export const resetPasswordSchema = z
  .object({
    // Backend expects exactly 6 digits (@IsNumberString @Length(6,6)).
    code: z.string().regex(/^\d{6}$/, 'Mã xác minh gồm 6 chữ số.'),
    newPassword: z
      .string()
      .min(8, 'Mật khẩu cần tối thiểu 8 ký tự.')
      .max(72, 'Mật khẩu tối đa 72 ký tự.')
      .regex(STRONG_PASSWORD, 'Mật khẩu cần có chữ hoa, chữ thường và số.'),
    confirmNewPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmNewPassword, {
    message: 'Mật khẩu nhập lại không khớp.',
    path: ['confirmNewPassword'],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Nhập mật khẩu hiện tại.'),
    newPassword: z
      .string()
      .min(8, 'Mật khẩu cần tối thiểu 8 ký tự.')
      .max(72, 'Mật khẩu tối đa 72 ký tự.')
      .regex(STRONG_PASSWORD, 'Mật khẩu cần có chữ hoa, chữ thường và số.'),
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
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
