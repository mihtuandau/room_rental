import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/prisma/prisma.service';
import { OtpPurpose, Role } from '../../../generated/prisma/client';
import { AuthService } from './auth.service';
import { EmailService } from './email/email.service';
import { GoogleTokenService } from './google/google-token.service';

describe('AuthService registration OTP', () => {
  it('atomically consumes a valid OTP and creates a verified account', async () => {
    const codeHash = await bcrypt.hash('123456', 4);
    const otp = {
      id: 'otp-1',
      email: 'owner@example.com',
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
      {} as GoogleTokenService,
    );

    const result = await service.register({
      email: otp.email,
      password: 'safe-password',
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
        email: otp.email,
        passwordHash: expect.any(String),
        fullName: 'Nguyễn Văn A',
        role: Role.user,
        isEmailVerified: true,
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
      email: 'owner@example.com',
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
      {} as ConfigService,
      {} as EmailService,
      {} as GoogleTokenService,
    );

    await expect(
      service.register({
        email: otp.email,
        password: 'safe-password',
        otpCode: '123456',
      }),
    ).rejects.toThrow('Incorrect OTP code.');
    expect(prisma.otpCode.update).toHaveBeenCalledWith({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
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
      {} as ConfigService,
      email as unknown as EmailService,
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

  it('sends registration OTP by email only', async () => {
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue(null) },
      otpCode: { create: jest.fn().mockResolvedValue({}) },
    };
    const email = { send: jest.fn().mockResolvedValue(undefined) };
    const service = new AuthService(
      prisma as unknown as PrismaService,
      {} as JwtService,
      {} as ConfigService,
      email as unknown as EmailService,
      {} as GoogleTokenService,
    );

    await service.sendOtp({ email: 'owner@example.com' }, OtpPurpose.register);

    expect(prisma.otpCode.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'owner@example.com',
        purpose: OtpPurpose.register,
        codeHash: expect.any(String),
        expiresAt: expect.any(Date),
      }),
    });
    expect(email.send).toHaveBeenCalledWith(
      'owner@example.com',
      expect.any(String),
      expect.stringContaining('Mã xác minh'),
    );
  });

  it('rejects phone-only OTP requests', async () => {
    const service = new AuthService(
      {} as PrismaService,
      {} as JwtService,
      {} as ConfigService,
      {} as EmailService,
      {} as GoogleTokenService,
    );

    await expect(
      service.sendOtp({ phone: '0912345678' }, OtpPurpose.register),
    ).rejects.toThrow('OTP is available by email only.');
  });
});
