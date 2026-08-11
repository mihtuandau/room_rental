import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma, Role, RoomStatus } from '../../../../generated/prisma/client';
import { ListUsersQueryDto } from './dto/list-users-query.dto';

const USER_SAFE_SELECT = {
  id: true,
  phone: true,
  email: true,
  fullName: true,
  role: true,
  isPhoneVerified: true,
  deletedAt: true,
  createdAt: true,
  _count: {
    select: {
      rooms: { where: { deletedAt: null } },
    },
  },
  rooms: {
    where: { status: RoomStatus.active, deletedAt: null },
    select: { id: true },
    take: 1,
  },
} as const;

@Injectable()
export class AdminUsersService {
  constructor(private prisma: PrismaService) {}

  private buildWhere({
    role,
    keyword,
    status,
    listing,
  }: Pick<
    ListUsersQueryDto,
    'role' | 'keyword' | 'status' | 'listing'
  >): Prisma.UserWhereInput {
    const normalizedKeyword = keyword?.trim();
    return {
      ...(role && { role }),
      ...(status === 'active' && { deletedAt: null }),
      ...(status === 'banned' && { deletedAt: { not: null } }),
      ...(listing === 'none' && {
        rooms: { none: { deletedAt: null } },
      }),
      ...(listing === 'any' && {
        rooms: { some: { deletedAt: null } },
      }),
      ...(listing === 'active' && {
        rooms: {
          some: { status: RoomStatus.active, deletedAt: null },
        },
      }),
      ...(normalizedKeyword && {
        OR: [
          {
            fullName: {
              contains: normalizedKeyword,
              mode: 'insensitive' as const,
            },
          },
          {
            phone: {
              contains: normalizedKeyword,
              mode: 'insensitive' as const,
            },
          },
          {
            email: {
              contains: normalizedKeyword,
              mode: 'insensitive' as const,
            },
          },
        ],
      }),
    };
  }

  async list(query: ListUsersQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where = this.buildWhere(query);
    const summaryWhere = this.buildWhere({
      role: query.role,
      keyword: query.keyword,
      listing: query.listing,
      status: undefined,
    });
    const [users, total, active, unverified, banned] =
      await this.prisma.$transaction([
        this.prisma.user.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: USER_SAFE_SELECT,
        }),
        this.prisma.user.count({ where }),
        this.prisma.user.count({ where: { ...summaryWhere, deletedAt: null } }),
        this.prisma.user.count({
          where: { ...summaryWhere, deletedAt: null, isPhoneVerified: false },
        }),
        this.prisma.user.count({
          where: { ...summaryWhere, deletedAt: { not: null } },
        }),
      ]);
    return {
      users: users.map((user) => this.toResponse(user)),
      total,
      page,
      pageSize,
      summary: { active, unverified, banned },
    };
  }

  async export(query: ListUsersQueryDto) {
    const users = await this.prisma.user.findMany({
      where: this.buildWhere(query),
      orderBy: { createdAt: 'desc' },
      take: 10_000,
      select: USER_SAFE_SELECT,
    });
    const total = await this.prisma.user.count({
      where: this.buildWhere(query),
    });
    return {
      users: users.map((user) => this.toResponse(user)),
      total,
      truncated: total > users.length,
    };
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

    const bannedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        tokenVersion: { increment: 1 }, // revoke every active session immediately
      },
      select: USER_SAFE_SELECT,
    });
    return this.toResponse(bannedUser);
  }

  async unban(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');

    const unbannedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: null },
      select: USER_SAFE_SELECT,
    });
    return this.toResponse(unbannedUser);
  }

  private toResponse(
    user: Prisma.UserGetPayload<{ select: typeof USER_SAFE_SELECT }>,
  ) {
    const { _count, rooms, ...safeUser } = user;
    return {
      ...safeUser,
      listingCount: _count.rooms,
      hasActiveListing: rooms.length > 0,
    };
  }
}
