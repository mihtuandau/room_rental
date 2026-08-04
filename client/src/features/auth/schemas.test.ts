import { describe, expect, it } from 'vitest';
import { forgotPasswordSchema, registerSchema } from './schemas';

describe('auth registration OTP contracts', () => {
  it('accepts either an email or phone for registration OTP', () => {
    expect(
      registerSchema.safeParse({
        identifier: '0912345678',
        password: 'StrongPass1',
        confirmPassword: 'StrongPass1',
        otpCode: '123456',
      }).success,
    ).toBe(true);

    expect(
      registerSchema.safeParse({
        identifier: 'owner@example.com',
        password: 'StrongPass1',
        confirmPassword: 'StrongPass1',
        otpCode: '123456',
      }).success,
    ).toBe(true);
  });

  it('requires an email for password recovery', () => {
    expect(forgotPasswordSchema.safeParse({ identifier: '0912345678' }).success).toBe(false);
    expect(forgotPasswordSchema.safeParse({ identifier: 'owner@example.com' }).success).toBe(true);
  });
});
