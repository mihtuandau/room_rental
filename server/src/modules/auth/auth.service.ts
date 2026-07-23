import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@/prisma/prisma.service';
import { OtpPurpose, Role } from '../../../generated/prisma/client';
import { SmsService } from './sms/sms.service';
import {
  GoogleProfile,
  GoogleTokenService,
} from './google/google-token.service';
import { RegisterDto } from './dto/register.dto';

const PASSWORD_HASH_COST = 12;
const OTP_HASH_COST = 10;
const OTP_TTL_MS = 5 * 60_000;
const OTP_MAX_ATTEMPTS = 5;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private sms: SmsService,
    private googleToken: GoogleTokenService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });
    if (existing)
      throw new ConflictException('This phone number is already registered.');

    const passwordHash = await bcrypt.hash(dto.password, PASSWORD_HASH_COST);
    const user = await this.prisma.user.create({
      data: {
        phone: dto.phone,
        passwordHash,
        fullName: dto.fullName,
        role: dto.role === 'landlord' ? Role.landlord : Role.tenant,
      },
    });
    return this.issueTokens(user.id, user.role, user.tokenVersion);
  }

  async login(phone: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (
      !user ||
      user.deletedAt ||
      // Google-only accounts have no password — reject with the same generic
      // message so this endpoint never reveals how an account was created.
      !user.passwordHash ||
      !(await bcrypt.compare(password, user.passwordHash))
    ) {
      throw new UnauthorizedException('Invalid phone number or password.');
    }
    return this.issueTokens(user.id, user.role, user.tokenVersion);
  }

  async loginWithGoogle(idToken: string) {
    const profile = await this.googleToken.verify(idToken);
    const user = await this.findOrCreateGoogleUser(profile);
    if (user.deletedAt) {
      throw new ForbiddenException('This account has been suspended.');
    }
    return this.issueTokens(user.id, user.role, user.tokenVersion);
  }

  // Resolution order matters: googleId is the stable identifier (a Google
  // account can change its email), and matching on email second lets an
  // existing password account adopt Google sign-in instead of ending up with
  // two separate accounts for the same person.
  async findOrCreateGoogleUser(profile: GoogleProfile) {
    const byGoogleId = await this.prisma.user.findUnique({
      where: { googleId: profile.googleId },
    });
    if (byGoogleId) return byGoogleId;

    const byEmail = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });
    if (byEmail) {
      return this.prisma.user.update({
        where: { id: byEmail.id },
        data: {
          googleId: profile.googleId,
          // only fill blanks — never overwrite what the user set themselves
          fullName: byEmail.fullName ?? profile.fullName,
          avatarUrl: byEmail.avatarUrl ?? profile.avatarUrl,
        },
      });
    }

    return this.prisma.user.create({
      data: {
        googleId: profile.googleId,
        email: profile.email,
        fullName: profile.fullName,
        avatarUrl: profile.avatarUrl,
        role: Role.tenant,
      },
    });
  }

  async issueTokens(userId: string, role: string, tokenVersion: number) {
    const accessToken = await this.jwt.signAsync(
      { sub: userId, role },
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
    // an old token (from a previous logout/password change) has a mismatched tokenVersion → rejected
    if (!user || user.deletedAt || user.tokenVersion !== tokenVersion) {
      throw new ForbiddenException('Session expired, please log in again.');
    }
    return this.issueTokens(user.id, user.role, user.tokenVersion);
  }

  async logout(userId: string) {
    // increment tokenVersion → every refresh token issued before this becomes invalid immediately
    await this.prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });
  }

  async sendOtp(phone: string, purpose: OtpPurpose) {
    if (purpose === OtpPurpose.reset_password) {
      const user = await this.prisma.user.findUnique({ where: { phone } });
      if (!user || user.deletedAt)
        throw new NotFoundException('No account found for this phone number.');
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = await bcrypt.hash(code, OTP_HASH_COST);
    await this.prisma.otpCode.create({
      data: {
        phone,
        codeHash,
        purpose,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });
    // send via SMS provider — never log the raw code in production
    await this.sms.send(phone, `Your RoomRent verification code is: ${code}`);
  }

  async verifyOtp(phone: string, purpose: OtpPurpose, code: string) {
    const otp = await this.prisma.otpCode.findFirst({
      where: { phone, purpose, usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!otp || otp.attempts >= OTP_MAX_ATTEMPTS) {
      throw new ForbiddenException('OTP code is invalid or has expired.');
    }
    if (!(await bcrypt.compare(code, otp.codeHash))) {
      await this.prisma.otpCode.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException('Incorrect OTP code.');
    }
    // single-use: mark consumed so it can't be replayed
    await this.prisma.otpCode.update({
      where: { id: otp.id },
      data: { usedAt: new Date() },
    });

    if (purpose === OtpPurpose.register) {
      await this.prisma.user.updateMany({
        where: { phone },
        data: { isPhoneVerified: true },
      });
    }
  }

  async resetPassword(phone: string, code: string, newPassword: string) {
    await this.verifyOtp(phone, OtpPurpose.reset_password, code);

    const passwordHash = await bcrypt.hash(newPassword, PASSWORD_HASH_COST);
    await this.prisma.user.update({
      where: { phone },
      // bump tokenVersion so every previously issued refresh token is revoked
      data: { passwordHash, tokenVersion: { increment: 1 } },
    });
  }
}
