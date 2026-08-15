import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Optional,
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
import { SmsService } from './sms/sms.service';
import { CloudinaryService } from '../storage/cloudinary.service';
import {
  GoogleProfile,
  GoogleTokenService,
} from './google/google-token.service';
import {
  FacebookProfile,
  FacebookTokenService,
} from './facebook/facebook-token.service';

const PASSWORD_HASH_COST = 12;
const OTP_HASH_COST = 10;
const OTP_TTL_MS = 5 * 60_000;
const OTP_MAX_ATTEMPTS = 5;
const DEV_OTP_CODE = /^\d{6}$/;
type Identifier = { phone?: string; email?: string };

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private emailService: EmailService,
    private smsService: SmsService,
    private googleToken: GoogleTokenService,
    private facebookToken: FacebookTokenService,
    @Optional() private cloudinary?: CloudinaryService,
  ) {}

  async register(dto: RegisterDto) {
    const identifier = this.normalizeIdentifier({ phone: dto.phone });
    if (!identifier.phone)
      throw new BadRequestException('Phone number is required.');
    const existing = await this.findByIdentifier(identifier);
    if (existing)
      throw new ConflictException('This contact is already registered.');

    const otp = await this.validateOtp(
      identifier,
      OtpPurpose.register,
      dto.otpCode,
    );
    await this.smsService.confirmVerification(identifier.phone, dto.otpCode);
    const passwordHash = await bcrypt.hash(dto.password, PASSWORD_HASH_COST);
    const user = await this.prisma.$transaction(async (tx) => {
      const consumed = await tx.otpCode.updateMany({
        where: {
          id: otp.id,
          usedAt: null,
          revokedAt: null,
          expiresAt: { gt: new Date() },
          attempts: { lt: OTP_MAX_ATTEMPTS },
        },
        data: { usedAt: new Date() },
      });
      if (consumed.count !== 1)
        throw new ForbiddenException('OTP code is invalid or has expired.');
      return tx.user.create({
        data: {
          phone: identifier.phone,
          isPhoneVerified: true,
          passwordHash,
          fullName: dto.fullName,
          role: Role.user,
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
      const user = await this.prisma.user.update({
        where: { id: byGoogleId.id },
        data: {
          email: byGoogleId.email ?? profile.email,
          isEmailVerified: true,
          avatarUrl: this.getOwnedAvatarUrl(
            byGoogleId.avatarUrl,
            byGoogleId.id,
          ),
        },
      });
      return this.attachProviderAvatar(user, profile.avatarUrl);
    }
    const byEmail = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });
    if (byEmail) {
      const user = await this.prisma.user.update({
        where: { id: byEmail.id },
        data: {
          googleId: profile.googleId,
          isEmailVerified: true,
          fullName: byEmail.fullName ?? profile.fullName,
          avatarUrl: this.getOwnedAvatarUrl(byEmail.avatarUrl, byEmail.id),
        },
      });
      return this.attachProviderAvatar(user, profile.avatarUrl);
    }
    const user = await this.prisma.user.create({
      data: {
        googleId: profile.googleId,
        email: profile.email,
        isEmailVerified: true,
        fullName: profile.fullName,
        // Provider avatars are external URLs. Avatars stored by RoomRent
        // must be Cloudinary-owned so they remain controllable and safe to
        // render from the configured image origin.
        avatarUrl: null,
        role: Role.user,
      },
    });
    return this.attachProviderAvatar(user, profile.avatarUrl);
  }

  async loginWithFacebook(accessToken: string) {
    const profile = await this.facebookToken.verify(accessToken);
    const user = await this.findOrCreateFacebookUser(profile);
    if (user.deletedAt)
      throw new ForbiddenException('This account has been suspended.');
    return this.issueTokens(user.id, user.role, user.tokenVersion);
  }

  async findOrCreateFacebookUser(profile: FacebookProfile) {
    const byFacebookId = await this.prisma.user.findUnique({
      where: { facebookId: profile.facebookId },
    });
    if (byFacebookId) {
      const user = await this.prisma.user.update({
        where: { id: byFacebookId.id },
        data: {
          email: byFacebookId.email ?? profile.email,
          isEmailVerified: !!(byFacebookId.email || profile.email),
          avatarUrl: this.getOwnedAvatarUrl(
            byFacebookId.avatarUrl,
            byFacebookId.id,
          ),
        },
      });
      return this.attachProviderAvatar(user, profile.avatarUrl);
    }

    if (profile.email) {
      const byEmail = await this.prisma.user.findUnique({
        where: { email: profile.email },
      });
      if (byEmail) {
        const user = await this.prisma.user.update({
          where: { id: byEmail.id },
          data: {
            facebookId: profile.facebookId,
            isEmailVerified: true,
            fullName: byEmail.fullName ?? profile.fullName,
            avatarUrl: this.getOwnedAvatarUrl(byEmail.avatarUrl, byEmail.id),
          },
        });
        return this.attachProviderAvatar(user, profile.avatarUrl);
      }
    }

    const user = await this.prisma.user.create({
      data: {
        facebookId: profile.facebookId,
        email: profile.email,
        isEmailVerified: !!profile.email,
        fullName: profile.fullName,
        avatarUrl: null,
        role: Role.user,
      },
    });
    return this.attachProviderAvatar(user, profile.avatarUrl);
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

  private getOwnedAvatarUrl(
    avatarUrl: string | null | undefined,
    userId: string,
  ) {
    if (!avatarUrl) return null;
    try {
      const url = new URL(avatarUrl);
      const cloudName = this.config.get<string>('CLOUDINARY_CLOUD_NAME');
      if (!cloudName) return null;
      const uploadPrefix = `/${cloudName}/image/upload/`;
      const relativePath = url.pathname.startsWith(uploadPrefix)
        ? url.pathname.slice(uploadPrefix.length)
        : '';
      const pathSegments = relativePath.split('/').filter(Boolean);
      const avatarFolderIndex = pathSegments.indexOf('avatars');
      return url.protocol === 'https:' &&
        url.hostname === 'res.cloudinary.com' &&
        avatarFolderIndex >= 0 &&
        pathSegments[avatarFolderIndex + 1] === userId &&
        pathSegments.length > avatarFolderIndex + 2
        ? avatarUrl
        : null;
    } catch {
      return null;
    }
  }

  private async attachProviderAvatar<
    T extends { id: string; avatarUrl: string | null },
  >(user: T, providerAvatarUrl: string | undefined) {
    if (!providerAvatarUrl || user.avatarUrl || !this.cloudinary) return user;
    const cloudinaryUrl = await this.cloudinary.importProviderAvatar(
      providerAvatarUrl,
      user.id,
    );
    if (!cloudinaryUrl) return user;
    return this.prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl: cloudinaryUrl },
    });
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
    if (!identifier.email && !identifier.phone) {
      throw new BadRequestException('Email or phone number is required.');
    }
    if (identifier.email && identifier.phone) {
      throw new BadRequestException('Provide only one OTP destination.');
    }
    if (purpose === OtpPurpose.change_phone) {
      throw new ForbiddenException(
        'Contact-phone verification requires an authenticated account.',
      );
    }
    if (purpose === OtpPurpose.register && identifier.email) {
      throw new BadRequestException(
        'Registration OTP is available by phone only.',
      );
    }
    const user = await this.findByIdentifier(identifier);
    if (purpose === OtpPurpose.reset_password) {
      if (!user || user.deletedAt) return; // prevent account enumeration
    }
    if (purpose === OtpPurpose.register && user && !user.deletedAt)
      throw new ConflictException('This contact is already registered.');

    const configuredDevCode = this.config.get<string>('DEV_OTP_CODE');
    const code =
      identifier.phone &&
      !this.smsService.usesTwilioVerify() &&
      this.config.get<string>('NODE_ENV') !== 'production' &&
      configuredDevCode &&
      DEV_OTP_CODE.test(configuredDevCode)
        ? configuredDevCode
        : randomInt(100000, 1_000_000).toString();
    const codeHash = await bcrypt.hash(code, OTP_HASH_COST);
    await this.revokePreviousOtps(identifier, purpose);
    await this.prisma.otpCode.create({
      data: {
        ...(identifier.email
          ? { email: identifier.email }
          : { phone: identifier.phone }),
        codeHash,
        purpose,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });
    if (identifier.email) {
      await this.emailService.send(
        identifier.email,
        'Mã xác minh Trọ Ơi',
        `Mã xác minh của bạn là ${code}. Mã có hiệu lực trong 5 phút.`,
      );
    } else {
      await this.smsService.sendVerification(identifier.phone!, code);
    }
  }

  async verifyOtp(
    rawIdentifier: Identifier,
    purpose: OtpPurpose,
    code: string,
  ) {
    const identifier = this.normalizeIdentifier(rawIdentifier);
    if (!identifier.email && !identifier.phone) {
      throw new BadRequestException('Email or phone number is required.');
    }
    if (identifier.email && identifier.phone) {
      throw new BadRequestException('Provide only one OTP destination.');
    }
    if (purpose === OtpPurpose.change_phone) {
      throw new ForbiddenException(
        'Contact-phone verification requires an authenticated account.',
      );
    }
    if (purpose === OtpPurpose.register && identifier.email) {
      throw new BadRequestException(
        'Registration OTP is available by phone only.',
      );
    }
    const otp = await this.validateOtp(identifier, purpose, code);
    if (identifier.phone) {
      await this.smsService.confirmVerification(identifier.phone, code);
    }
    const consumed = await this.prisma.otpCode.updateMany({
      where: {
        id: otp.id,
        usedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() },
        attempts: { lt: OTP_MAX_ATTEMPTS },
      },
      data: { usedAt: new Date() },
    });
    if (consumed.count !== 1)
      throw new ForbiddenException('OTP code is invalid or has expired.');
  }

  async sendContactPhoneOtp(userId: string, rawPhone: string) {
    const phone = this.normalizeIdentifier({ phone: rawPhone }).phone;
    if (!phone) throw new BadRequestException('Phone number is required.');

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { contactPhone: true, deletedAt: true },
    });
    if (!user || user.deletedAt || user.contactPhone !== phone) {
      throw new BadRequestException(
        'The phone must match the contact phone in your profile.',
      );
    }

    const loginOwner = await this.prisma.user.findUnique({
      where: { phone },
      select: { id: true },
    });
    if (loginOwner && loginOwner.id !== userId) {
      throw new ConflictException(
        'This phone is already used by another account.',
      );
    }

    const configuredDevCode = this.config.get<string>('DEV_OTP_CODE');
    const code =
      !this.smsService.usesTwilioVerify() &&
      this.config.get<string>('NODE_ENV') !== 'production' &&
      configuredDevCode &&
      DEV_OTP_CODE.test(configuredDevCode)
        ? configuredDevCode
        : randomInt(100000, 1_000_000).toString();
    const codeHash = await bcrypt.hash(code, OTP_HASH_COST);
    await this.revokePreviousOtps({ phone }, OtpPurpose.change_phone);
    await this.prisma.otpCode.create({
      data: {
        phone,
        codeHash,
        purpose: OtpPurpose.change_phone,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });
    await this.smsService.sendVerification(phone, code);
  }

  async verifyContactPhoneOtp(userId: string, rawPhone: string, code: string) {
    const phone = this.normalizeIdentifier({ phone: rawPhone }).phone;
    if (!phone) throw new BadRequestException('Phone number is required.');

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { contactPhone: true, deletedAt: true },
    });
    if (!user || user.deletedAt || user.contactPhone !== phone) {
      throw new BadRequestException(
        'The phone must match the contact phone in your profile.',
      );
    }

    const otp = await this.validateOtp(
      { phone },
      OtpPurpose.change_phone,
      code,
    );
    await this.smsService.confirmVerification(phone, code);
    await this.prisma.$transaction(async (tx) => {
      const consumed = await tx.otpCode.updateMany({
        where: {
          id: otp.id,
          phone,
          purpose: OtpPurpose.change_phone,
          usedAt: null,
          revokedAt: null,
          expiresAt: { gt: new Date() },
          attempts: { lt: OTP_MAX_ATTEMPTS },
        },
        data: { usedAt: new Date() },
      });
      if (consumed.count !== 1) {
        throw new ForbiddenException('OTP code is invalid or has expired.');
      }
      const updated = await tx.user.updateMany({
        where: { id: userId, contactPhone: phone, deletedAt: null },
        data: { contactPhoneVerified: true },
      });
      if (updated.count !== 1) {
        throw new BadRequestException(
          'Contact phone changed. Request a new OTP.',
        );
      }
    });
  }

  async verifyResetOtp(dto: Identifier & { code: string }) {
    const identifier = this.normalizeIdentifier(dto);
    if (!identifier.email && !identifier.phone) {
      throw new BadRequestException('Email or phone number is required.');
    }
    if (identifier.email && identifier.phone) {
      throw new BadRequestException('Provide only one OTP destination.');
    }
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
        revokedAt: null,
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

  /** Only the latest code remains usable for a destination and purpose. */
  private async revokePreviousOtps(
    identifier: Identifier,
    purpose: OtpPurpose,
  ) {
    await this.prisma.otpCode.updateMany({
      where: {
        ...(identifier.email
          ? { email: identifier.email }
          : { phone: identifier.phone }),
        purpose,
        usedAt: null,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  async resetPassword(
    rawIdentifier: Identifier,
    code: string,
    newPassword: string,
  ) {
    const identifier = this.normalizeIdentifier(rawIdentifier);
    if (!identifier.email && !identifier.phone) {
      throw new BadRequestException('Email or phone number is required.');
    }
    if (identifier.email && identifier.phone) {
      throw new BadRequestException('Provide only one OTP destination.');
    }
    const otp = await this.validateOtp(
      identifier,
      OtpPurpose.reset_password,
      code,
    );
    if (identifier.phone) {
      await this.smsService.confirmVerification(identifier.phone, code);
    }
    const passwordHash = await bcrypt.hash(newPassword, PASSWORD_HASH_COST);
    await this.prisma.$transaction(async (tx) => {
      const consumed = await tx.otpCode.updateMany({
        where: {
          id: otp.id,
          usedAt: null,
          revokedAt: null,
          expiresAt: { gt: new Date() },
          attempts: { lt: OTP_MAX_ATTEMPTS },
        },
        data: { usedAt: new Date() },
      });
      if (consumed.count !== 1)
        throw new ForbiddenException('OTP code is invalid or has expired.');
      const updated = await tx.user.updateMany({
        where: {
          ...(identifier.email
            ? { email: identifier.email }
            : { phone: identifier.phone }),
          deletedAt: null,
        },
        data: { passwordHash, tokenVersion: { increment: 1 } },
      });
      if (updated.count !== 1) {
        throw new ForbiddenException('Password reset is no longer available.');
      }
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
