import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'node:crypto';
import { PrismaService } from '@/prisma/prisma.service';
import { OtpPurpose, Role } from '../../../generated/prisma/client';
import { RegisterDto } from './dto/register.dto';
import { EmailService } from './email/email.service';
import {
  GoogleProfile,
  GoogleTokenService,
} from './google/google-token.service';

const PASSWORD_HASH_COST = 12;
const OTP_HASH_COST = 10;
const OTP_TTL_MS = 5 * 60_000;
const OTP_MAX_ATTEMPTS = 5;
type Identifier = { phone?: string; email?: string };

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private emailService: EmailService,
    private googleToken: GoogleTokenService,
  ) {}

  async register(dto: RegisterDto) {
    const identifier = this.normalizeIdentifier(dto);
    const existing = await this.findByIdentifier(identifier);
    if (existing)
      throw new ConflictException('This contact is already registered.');

    const otp = await this.validateOtp(
      identifier,
      OtpPurpose.register,
      dto.otpCode,
    );
    const passwordHash = await bcrypt.hash(dto.password, PASSWORD_HASH_COST);
    const user = await this.prisma.$transaction(async (tx) => {
      const consumed = await tx.otpCode.updateMany({
        where: {
          id: otp.id,
          usedAt: null,
          expiresAt: { gt: new Date() },
          attempts: { lt: OTP_MAX_ATTEMPTS },
        },
        data: { usedAt: new Date() },
      });
      if (consumed.count !== 1)
        throw new ForbiddenException('OTP code is invalid or has expired.');
      return tx.user.create({
        data: {
          email: identifier.email!,
          passwordHash,
          fullName: dto.fullName,
          role: Role.user,
          isEmailVerified: true,
        },
      });
    });
    return this.issueTokens(user.id, user.role, user.tokenVersion);
  }

  async login(identifier: Identifier, password: string) {
    const user = await this.findByIdentifier(
      this.normalizeIdentifier(identifier),
    );
    if (
      !user ||
      user.deletedAt ||
      !user.passwordHash ||
      !(await bcrypt.compare(password, user.passwordHash))
    ) {
      throw new UnauthorizedException('Invalid email/phone or password.');
    }
    return this.issueTokens(user.id, user.role, user.tokenVersion);
  }

  async loginWithGoogle(idToken: string) {
    const profile = await this.googleToken.verify(idToken);
    const user = await this.findOrCreateGoogleUser(profile);
    if (user.deletedAt)
      throw new ForbiddenException('This account has been suspended.');
    return this.issueTokens(user.id, user.role, user.tokenVersion);
  }

  async findOrCreateGoogleUser(profile: GoogleProfile) {
    const byGoogleId = await this.prisma.user.findUnique({
      where: { googleId: profile.googleId },
    });
    if (byGoogleId) {
      return this.prisma.user.update({
        where: { id: byGoogleId.id },
        data: {
          email: byGoogleId.email ?? profile.email,
          isEmailVerified: true,
        },
      });
    }
    const byEmail = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });
    if (byEmail) {
      return this.prisma.user.update({
        where: { id: byEmail.id },
        data: {
          googleId: profile.googleId,
          isEmailVerified: true,
          fullName: byEmail.fullName ?? profile.fullName,
          avatarUrl: byEmail.avatarUrl ?? profile.avatarUrl,
        },
      });
    }
    return this.prisma.user.create({
      data: {
        googleId: profile.googleId,
        email: profile.email,
        isEmailVerified: true,
        fullName: profile.fullName,
        avatarUrl: profile.avatarUrl,
        role: Role.user,
      },
    });
  }

  async issueTokens(userId: string, role: string, tokenVersion: number) {
    const accessToken = await this.jwt.signAsync(
      { sub: userId, role, tokenVersion },
      {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get<string>(
          'JWT_ACCESS_EXPIRES_IN',
        ) as unknown as number,
      },
    );
    const refreshToken = await this.jwt.signAsync(
      { sub: userId, tokenVersion },
      {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>(
          'JWT_REFRESH_EXPIRES_IN',
        ) as unknown as number,
      },
    );
    return { accessToken, refreshToken };
  }

  async refresh(userId: string, tokenVersion: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt || user.tokenVersion !== tokenVersion)
      throw new ForbiddenException('Session expired, please log in again.');
    return this.issueTokens(user.id, user.role, user.tokenVersion);
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });
  }

  async sendOtp(rawIdentifier: Identifier, purpose: OtpPurpose) {
    const identifier = this.normalizeIdentifier(rawIdentifier);
    if (!identifier.email) {
      throw new ForbiddenException('OTP is available by email only.');
    }
    const user = await this.findByIdentifier(identifier);
    if (purpose === OtpPurpose.reset_password) {
      if (!user || user.deletedAt) return; // prevent account enumeration
    }
    if (purpose === OtpPurpose.register && user && !user.deletedAt)
      throw new ConflictException('This contact is already registered.');

    const code = randomInt(100000, 1_000_000).toString();
    const codeHash = await bcrypt.hash(code, OTP_HASH_COST);
    await this.prisma.otpCode.create({
      data: {
        email: identifier.email,
        codeHash,
        purpose,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });
    await this.emailService.send(
      identifier.email,
      'Mã xác minh Trọ Ơi',
      `Mã xác minh của bạn là ${code}. Mã có hiệu lực trong 5 phút.`,
    );
  }

  async verifyOtp(
    rawIdentifier: Identifier,
    purpose: OtpPurpose,
    code: string,
  ) {
    const identifier = this.normalizeIdentifier(rawIdentifier);
    const otp = await this.validateOtp(identifier, purpose, code);
    const consumed = await this.prisma.otpCode.updateMany({
      where: {
        id: otp.id,
        usedAt: null,
        expiresAt: { gt: new Date() },
        attempts: { lt: OTP_MAX_ATTEMPTS },
      },
      data: { usedAt: new Date() },
    });
    if (consumed.count !== 1)
      throw new ForbiddenException('OTP code is invalid or has expired.');
    if (purpose === OtpPurpose.register) {
      if (identifier.email)
        await this.prisma.user.updateMany({
          where: { email: identifier.email },
          data: { isEmailVerified: true },
        });
    }
  }

  async verifyResetOtp(dto: { email: string; code: string }) {
    const identifier = this.normalizeIdentifier(dto);
    if (!identifier.email)
      throw new ForbiddenException('A verified email is required.');
    await this.validateOtp(identifier, OtpPurpose.reset_password, dto.code);
  }

  private async validateOtp(
    identifier: Identifier,
    purpose: OtpPurpose,
    code: string,
  ) {
    const otp = await this.prisma.otpCode.findFirst({
      where: {
        ...(identifier.email
          ? { email: identifier.email }
          : { phone: identifier.phone }),
        purpose,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!otp || otp.attempts >= OTP_MAX_ATTEMPTS)
      throw new ForbiddenException('OTP code is invalid or has expired.');
    if (!(await bcrypt.compare(code, otp.codeHash))) {
      await this.prisma.otpCode.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException('Incorrect OTP code.');
    }
    return otp;
  }

  async resetPassword(
    rawIdentifier: Identifier,
    code: string,
    newPassword: string,
  ) {
    const identifier = this.normalizeIdentifier(rawIdentifier);
    const otp = await this.validateOtp(
      identifier,
      OtpPurpose.reset_password,
      code,
    );
    const passwordHash = await bcrypt.hash(newPassword, PASSWORD_HASH_COST);
    await this.prisma.$transaction(async (tx) => {
      const consumed = await tx.otpCode.updateMany({
        where: {
          id: otp.id,
          usedAt: null,
          expiresAt: { gt: new Date() },
          attempts: { lt: OTP_MAX_ATTEMPTS },
        },
        data: { usedAt: new Date() },
      });
      if (consumed.count !== 1)
        throw new ForbiddenException('OTP code is invalid or has expired.');
      await tx.user.update({
        where: { email: identifier.email },
        data: { passwordHash, tokenVersion: { increment: 1 } },
      });
    });
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true, deletedAt: true },
    });
    if (
      !user ||
      user.deletedAt ||
      !user.passwordHash ||
      !(await bcrypt.compare(currentPassword, user.passwordHash))
    ) {
      throw new UnauthorizedException('Current password is incorrect.');
    }
    if (currentPassword === newPassword) {
      throw new ForbiddenException(
        'New password must be different from the current password.',
      );
    }
    const passwordHash = await bcrypt.hash(newPassword, PASSWORD_HASH_COST);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, tokenVersion: { increment: 1 } },
    });
  }

  private normalizeIdentifier(identifier: Identifier) {
    return {
      phone: identifier.phone?.trim() || undefined,
      email: identifier.email?.trim().toLowerCase() || undefined,
    };
  }

  private findByIdentifier(identifier: Identifier) {
    return identifier.email
      ? this.prisma.user.findUnique({ where: { email: identifier.email } })
      : identifier.phone
        ? this.prisma.user.findUnique({ where: { phone: identifier.phone } })
        : Promise.resolve(null);
  }
}
