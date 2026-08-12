import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/prisma/prisma.service';
import { OtpPurpose, Role } from '../../../generated/prisma/client';
import { AuthService } from './auth.service';
import { EmailService } from './email/email.service';
import { GoogleTokenService } from './google/google-token.service';
import { SmsService } from './sms/sms.service';

describe('AuthService registration OTP', () => {
  it('atomically consumes a valid OTP and creates a verified phone account', async () => {
    const codeHash = await bcrypt.hash('123456', 4);
    const otp = {
      id: 'otp-1',
      phone: '0912345678',
      purpose: OtpPurpose.register,
      codeHash,
      attempts: 0,
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    };
    const user = {
      id: 'user-1',
      role: Role.user,
      tokenVersion: 0,
    };
    const tx = {
      otpCode: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      user: { create: jest.fn().mockResolvedValue(user) },
    };
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue(null) },
      otpCode: {
        findFirst: jest.fn().mockResolvedValue(otp),
        update: jest.fn(),
      },
      $transaction: jest.fn((callback: (transaction: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    const jwt = {
      signAsync: jest
        .fn()
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token'),
    };
    const config = {
      get: jest.fn((key: string) =>
        key.includes('EXPIRES')
          ? '20m'
          : 'test-secret-with-at-least-32-characters',
      ),
    };
    const service = new AuthService(
      prisma as unknown as PrismaService,
      jwt as unknown as JwtService,
      config as unknown as ConfigService,
      {} as EmailService,
      {
        confirmVerification: jest.fn().mockResolvedValue(undefined),
      } as unknown as SmsService,
      {} as GoogleTokenService,
    );

    const result = await service.register({
      phone: otp.phone,
      password: 'SafePassword1',
      fullName: 'Nguyễn Văn A',
      otpCode: '123456',
    });

    expect(tx.otpCode.updateMany).toHaveBeenCalledWith({
      where: {
        id: otp.id,
        usedAt: null,
        expiresAt: { gt: expect.any(Date) },
        attempts: { lt: 5 },
      },
      data: { usedAt: expect.any(Date) },
    });
    expect(tx.user.create).toHaveBeenCalledWith({
      data: {
        phone: otp.phone,
        passwordHash: expect.any(String),
        fullName: 'Nguyễn Văn A',
        role: Role.user,
        isPhoneVerified: true,
      },
    });
    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
  });

  it('does not create an account when the OTP is incorrect', async () => {
    const otp = {
      id: 'otp-1',
      phone: '0912345678',
      purpose: OtpPurpose.register,
      codeHash: await bcrypt.hash('654321', 4),
      attempts: 0,
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    };
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue(null) },
      otpCode: {
        findFirst: jest.fn().mockResolvedValue(otp),
        update: jest.fn().mockResolvedValue(otp),
      },
      $transaction: jest.fn(),
    };
    const service = new AuthService(
      prisma as unknown as PrismaService,
      {} as JwtService,
      { get: jest.fn() } as unknown as ConfigService,
      {} as EmailService,
      {} as SmsService,
      {} as GoogleTokenService,
    );

    await expect(
      service.register({
        phone: otp.phone,
        password: 'SafePassword1',
        otpCode: '123456',
      }),
    ).rejects.toThrow('Incorrect OTP code.');
    expect(prisma.otpCode.update).toHaveBeenCalledWith({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('does not create a phone account when Twilio cannot confirm the OTP', async () => {
    const otp = {
      id: 'otp-phone-1',
      phone: '0912345678',
      purpose: OtpPurpose.register,
      codeHash: await bcrypt.hash('123456', 4),
      attempts: 0,
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    };
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue(null) },
      otpCode: {
        findFirst: jest.fn().mockResolvedValue(otp),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    const sms = {
      confirmVerification: jest
        .fn()
        .mockRejectedValue(new Error('Twilio unavailable')),
    };
    const service = new AuthService(
      prisma as unknown as PrismaService,
      {} as JwtService,
      { get: jest.fn() } as unknown as ConfigService,
      {} as EmailService,
      sms as unknown as SmsService,
      {} as GoogleTokenService,
    );

    await expect(
      service.register({
        phone: otp.phone,
        password: 'SafePassword1',
        otpCode: '123456',
      }),
    ).rejects.toThrow('Twilio unavailable');
    expect(sms.confirmVerification).toHaveBeenCalledWith(otp.phone, '123456');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('does not create an OTP for an unknown reset email', async () => {
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue(null) },
      otpCode: { create: jest.fn() },
    };
    const email = { send: jest.fn() };
    const service = new AuthService(
      prisma as unknown as PrismaService,
      {} as JwtService,
      { get: jest.fn() } as unknown as ConfigService,
      email as unknown as EmailService,
      {} as SmsService,
      {} as GoogleTokenService,
    );

    await expect(
      service.sendOtp(
        { email: 'unknown@example.com' },
        OtpPurpose.reset_password,
      ),
    ).resolves.toBeUndefined();
    expect(prisma.otpCode.create).not.toHaveBeenCalled();
    expect(email.send).not.toHaveBeenCalled();
  });

  it('rejects email registration OTP requests', async () => {
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue(null) },
      otpCode: { create: jest.fn().mockResolvedValue({}) },
    };
    const email = { send: jest.fn().mockResolvedValue(undefined) };
    const service = new AuthService(
      prisma as unknown as PrismaService,
      {} as JwtService,
      { get: jest.fn() } as unknown as ConfigService,
      email as unknown as EmailService,
      {} as SmsService,
      {} as GoogleTokenService,
    );

    await expect(
      service.sendOtp({ email: 'owner@example.com' }, OtpPurpose.register),
    ).rejects.toThrow('available by phone only');
    expect(prisma.otpCode.create).not.toHaveBeenCalled();
    expect(email.send).not.toHaveBeenCalled();
  });

  it('sends a phone registration OTP through the selected SMS provider', async () => {
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue(null) },
      otpCode: { create: jest.fn().mockResolvedValue({}) },
    };
    const sms = {
      usesTwilioVerify: jest.fn().mockReturnValue(true),
      sendVerification: jest.fn().mockResolvedValue(undefined),
    };
    const service = new AuthService(
      prisma as unknown as PrismaService,
      {} as JwtService,
      {
        get: jest.fn((key: string) =>
          key === 'DEV_OTP_CODE' ? '123456' : 'development',
        ),
      } as unknown as ConfigService,
      {} as EmailService,
      sms as unknown as SmsService,
      {} as GoogleTokenService,
    );

    await service.sendOtp({ phone: '0912345678' }, OtpPurpose.register);

    expect(sms.sendVerification).toHaveBeenCalledWith(
      '0912345678',
      expect.stringMatching(/^\d{6}$/),
    );
    expect(prisma.otpCode.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        phone: '0912345678',
        purpose: OtpPurpose.register,
        codeHash: expect.any(String),
      }),
    });
  });

  it('sends a password-reset OTP to an existing phone account', async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-1',
          phone: '0912345678',
          deletedAt: null,
        }),
      },
      otpCode: { create: jest.fn().mockResolvedValue({}) },
    };
    const sms = {
      usesTwilioVerify: jest.fn().mockReturnValue(true),
      sendVerification: jest.fn().mockResolvedValue(undefined),
    };
    const service = new AuthService(
      prisma as unknown as PrismaService,
      {} as JwtService,
      { get: jest.fn() } as unknown as ConfigService,
      {} as EmailService,
      sms as unknown as SmsService,
      {} as GoogleTokenService,
    );

    await service.sendOtp({ phone: '0912345678' }, OtpPurpose.reset_password);

    expect(prisma.otpCode.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        phone: '0912345678',
        purpose: OtpPurpose.reset_password,
        codeHash: expect.any(String),
      }),
    });
    expect(sms.sendVerification).toHaveBeenCalledWith(
      '0912345678',
      expect.stringMatching(/^\d{6}$/),
    );
  });

  it('resets a phone account password and revokes existing sessions', async () => {
    const otp = {
      id: 'otp-reset-phone',
      phone: '0912345678',
      purpose: OtpPurpose.reset_password,
      codeHash: await bcrypt.hash('123456', 4),
      attempts: 0,
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    };
    const tx = {
      otpCode: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      user: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    };
    const prisma = {
      otpCode: { findFirst: jest.fn().mockResolvedValue(otp) },
      $transaction: jest.fn((callback: (transaction: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    const sms = {
      confirmVerification: jest.fn().mockResolvedValue(undefined),
    };
    const service = new AuthService(
      prisma as unknown as PrismaService,
      {} as JwtService,
      {} as ConfigService,
      {} as EmailService,
      sms as unknown as SmsService,
      {} as GoogleTokenService,
    );

    await service.resetPassword(
      { phone: '0912345678' },
      '123456',
      'NewPassword1',
    );

    expect(sms.confirmVerification).toHaveBeenCalledWith(
      '0912345678',
      '123456',
    );
    expect(tx.user.updateMany).toHaveBeenCalledWith({
      where: { phone: '0912345678', deletedAt: null },
      data: {
        passwordHash: expect.any(String),
        tokenVersion: { increment: 1 },
      },
    });
  });

  it('rejects unauthenticated change-phone OTP requests', async () => {
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue(null) },
      otpCode: { create: jest.fn().mockResolvedValue({}) },
    };
    const sms = { sendVerification: jest.fn().mockResolvedValue(undefined) };
    const service = new AuthService(
      prisma as unknown as PrismaService,
      {} as JwtService,
      {
        get: jest.fn((key: string) =>
          key === 'NODE_ENV'
            ? 'development'
            : key === 'DEV_OTP_CODE'
              ? '123456'
              : undefined,
        ),
      } as unknown as ConfigService,
      {} as EmailService,
      sms as unknown as SmsService,
      {} as GoogleTokenService,
    );

    await expect(
      service.sendOtp({ phone: '0912345678' }, OtpPurpose.change_phone),
    ).rejects.toThrow('requires an authenticated account');
    expect(prisma.otpCode.create).not.toHaveBeenCalled();
    expect(sms.sendVerification).not.toHaveBeenCalled();
  });
});
