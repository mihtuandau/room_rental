import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

// Never select passwordHash/tokenVersion — safe fields only.
const PROFILE_SELECT = {
  id: true,
  phone: true,
  email: true,
  googleId: true,
  fullName: true,
  avatarUrl: true,
  contactPhone: true,
  zaloUrl: true,
  role: true,
  isPhoneVerified: true,
  isEmailVerified: true,
  createdAt: true,
} as const;

function toPublicProfile(profile: {
  googleId: string | null;
  email: string | null;
  [key: string]: unknown;
}) {
  const { googleId, ...safeProfile } = profile;
  return { ...safeProfile, googleLinked: Boolean(googleId) };
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const profile = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: PROFILE_SELECT,
    });
    return toPublicProfile(profile);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const profile = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: PROFILE_SELECT,
    });
    return toPublicProfile(profile);
  }
}
