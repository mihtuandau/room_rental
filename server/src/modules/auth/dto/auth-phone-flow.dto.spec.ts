import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RegisterDto } from './register.dto';
import { ResetPasswordDto } from './reset-password.dto';

describe('phone-first auth DTOs', () => {
  it('accepts phone registration and does not expose an email registration field', async () => {
    const valid = await validate(
      plainToInstance(RegisterDto, {
        phone: '0912345678',
        password: 'StrongPass1',
        otpCode: '123456',
      }),
    );
    const emailOnly = await validate(
      plainToInstance(RegisterDto, {
        email: 'owner@example.com',
        password: 'StrongPass1',
        otpCode: '123456',
      }),
    );

    expect(valid).toHaveLength(0);
    expect(emailOnly.some((error) => error.property === 'phone')).toBe(true);
    expect(new RegisterDto()).not.toHaveProperty('email');
  });

  it('accepts either phone or legacy email for password reset', async () => {
    const phoneErrors = await validate(
      plainToInstance(ResetPasswordDto, {
        phone: '0912345678',
        code: '123456',
        newPassword: 'StrongPass1',
      }),
    );
    const emailErrors = await validate(
      plainToInstance(ResetPasswordDto, {
        email: 'owner@example.com',
        code: '123456',
        newPassword: 'StrongPass1',
      }),
    );

    expect(phoneErrors).toHaveLength(0);
    expect(emailErrors).toHaveLength(0);
  });
});
