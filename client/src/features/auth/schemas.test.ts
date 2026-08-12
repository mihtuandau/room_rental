import { describe, expect, it } from 'vitest';
import { forgotPasswordSchema, loginSchema, registerSchema } from './schemas';

describe('auth registration OTP contracts', () => {
  it('accepts phone registration and rejects email registration', () => {
    expect(
      registerSchema.safeParse({
        identifier: '0912345678',
        password: 'StrongPass1',
        otpCode: '123456',
      }).success,
    ).toBe(true);

    expect(
      registerSchema.safeParse({
        identifier: 'owner@example.com',
        password: 'StrongPass1',
        otpCode: '123456',
      }).success,
    ).toBe(false);
  });

  it('requires a phone number for password recovery', () => {
    expect(forgotPasswordSchema.safeParse({ identifier: '0912345678' }).success).toBe(true);
    expect(forgotPasswordSchema.safeParse({ identifier: 'owner@example.com' }).success).toBe(false);
  });

  it('keeps the public password login flow phone-only', () => {
    expect(
      loginSchema.safeParse({
        identifier: '0912345678',
        password: 'StrongPass1',
      }).success,
    ).toBe(true);
    expect(
      loginSchema.safeParse({
        identifier: 'owner@example.com',
        password: 'StrongPass1',
      }).success,
    ).toBe(false);
  });
});
