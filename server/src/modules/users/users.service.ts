import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

// Select only the password presence flag; never return the hash itself.
const PROFILE_SELECT = {
  id: true,
  phone: true,
  email: true,
  googleId: true,
  passwordHash: true,
  fullName: true,
  avatarUrl: true,
  contactPhone: true,
  contactPhoneVerified: true,
  zaloUrl: true,
  role: true,
  isPhoneVerified: true,
  isEmailVerified: true,
  createdAt: true,
} as const;

function toPublicProfile(
  profile: {
    googleId: string | null;
    passwordHash: string | null;
    email: string | null;
    [key: string]: unknown;
  },
  safeAvatarUrl: string | null,
) {
  const { googleId, passwordHash, ...safeProfile } = profile;
  return {
    ...safeProfile,
    avatarUrl: safeAvatarUrl,
    googleLinked: Boolean(googleId),
    hasPassword: Boolean(passwordHash),
  };
}

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async getProfile(userId: string) {
    const profile = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: PROFILE_SELECT,
    });
    return toPublicProfile(
      profile,
      this.sanitizeCloudinaryAvatar(profile.avatarUrl, userId),
    );
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const current = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        contactPhone: true,
        contactPhoneVerified: true,
        phone: true,
        isPhoneVerified: true,
        deletedAt: true,
      },
    });
    if (!current || current.deletedAt) {
      throw new BadRequestException('Account is not available.');
    }
    if (dto.avatarUrl && !this.isOwnedCloudinaryAvatar(dto.avatarUrl, userId)) {
      throw new BadRequestException('Avatar must be uploaded to Cloudinary.');
    }

    const data = {
      ...(dto.fullName !== undefined ? { fullName: dto.fullName } : {}),
      ...(dto.avatarUrl !== undefined ? { avatarUrl: dto.avatarUrl } : {}),
      ...(dto.zaloUrl !== undefined ? { zaloUrl: dto.zaloUrl } : {}),
      ...(dto.contactPhone !== undefined
        ? {
            contactPhone: dto.contactPhone,
            // A changed contact phone must be verified again. Reusing the
            // already verified login phone is safe and keeps existing users
            // backwards-compatible.
            contactPhoneVerified:
              dto.contactPhone === current.contactPhone
                ? current.contactPhoneVerified
                : dto.contactPhone === current.phone && current.isPhoneVerified,
          }
        : {}),
    };
    const profile = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: PROFILE_SELECT,
    });
    return toPublicProfile(
      profile,
      this.sanitizeCloudinaryAvatar(profile.avatarUrl, userId),
    );
  }

  private isOwnedCloudinaryAvatar(urlValue: string, userId: string) {
    try {
      const url = new URL(urlValue);
      const cloudName = this.config.getOrThrow<string>('CLOUDINARY_CLOUD_NAME');
      const uploadPrefix = `/${cloudName}/image/upload/`;
      const relativePath = url.pathname.startsWith(uploadPrefix)
        ? url.pathname.slice(uploadPrefix.length)
        : '';
      const pathSegments = relativePath.split('/').filter(Boolean);
      const avatarFolderIndex = pathSegments.indexOf('avatars');
      return (
        url.protocol === 'https:' &&
        url.hostname === 'res.cloudinary.com' &&
        avatarFolderIndex >= 0 &&
        pathSegments[avatarFolderIndex + 1] === userId &&
        pathSegments.length > avatarFolderIndex + 2
      );
    } catch {
      return false;
    }
  }

  private sanitizeCloudinaryAvatar(
    avatarUrl: string | null | undefined,
    userId: string,
  ) {
    return avatarUrl && this.isOwnedCloudinaryAvatar(avatarUrl, userId)
      ? avatarUrl
      : null;
  }
}
