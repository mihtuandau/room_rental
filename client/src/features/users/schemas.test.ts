import { describe, expect, it } from 'vitest';
import { listingContactOtpSchema, listingContactSetupSchema } from './schemas';

describe('listing contact setup schema', () => {
  it('requires a valid Vietnamese contact phone', () => {
    expect(
      listingContactSetupSchema.safeParse({ contactPhone: '0912345678' }).success,
    ).toBe(true);
    expect(
      listingContactSetupSchema.safeParse({ contactPhone: '' }).success,
    ).toBe(false);
    expect(
      listingContactSetupSchema.safeParse({ contactPhone: '12345' }).success,
    ).toBe(false);
  });
});

describe('listing contact OTP schema', () => {
  it('accepts exactly six digits', () => {
    expect(listingContactOtpSchema.safeParse({ code: '123456' }).success).toBe(true);
    expect(listingContactOtpSchema.safeParse({ code: '12345' }).success).toBe(false);
    expect(listingContactOtpSchema.safeParse({ code: '12345a' }).success).toBe(false);
  });
});
