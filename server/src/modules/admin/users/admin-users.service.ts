import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Role } from '../../../../generated/prisma/client';

const USER_SAFE_SELECT = {
  id: true,
  phone: true,
  fullName: true,
  role: true,
  isPhoneVerified: true,
  deletedAt: true,
  createdAt: true,
} as const;

@Injectable()
export class AdminUsersService {
  constructor(private prisma: PrismaService) {}

  async list(role: Role | undefined, page: number, pageSize: number) {
    const where = { ...(role && { role }) };
    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: USER_SAFE_SELECT,
      }),
      this.prisma.user.count({ where }),
    ]);
    return { users, total, page, pageSize };
  }

  // "Ban" = soft delete, same mechanism the whole app already uses (HARD RULE #7:
  // never hard-delete a User). AuthService.login already rejects deletedAt users.
  async ban(adminId: string, userId: string) {
    if (adminId === userId)
      throw new BadRequestException('You cannot ban your own account.');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');
    if (user.role === Role.admin)
      throw new ForbiddenException('Cannot ban another admin.');

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        tokenVersion: { increment: 1 }, // revoke every active session immediately
      },
      select: USER_SAFE_SELECT,
    });
  }

  async unban(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');

    return this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: null },
      select: USER_SAFE_SELECT,
    });
  }
}
