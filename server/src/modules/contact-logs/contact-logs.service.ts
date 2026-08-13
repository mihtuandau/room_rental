import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ContactType, RoomStatus } from '../../../generated/prisma/client';

@Injectable()
export class ContactLogsService {
  constructor(private prisma: PrismaService) {}

  // HARD RULE #10 (CLAUDE.md): every reveal of a landlord's contact info must
  // be logged — anti-abuse data as well as landlord-facing stats.
  async logContact(userId: string, roomId: number, type: ContactType) {
    const room = await this.prisma.room.findFirst({
      where: {
        id: roomId,
        status: RoomStatus.active,
        deletedAt: null,
        owner: { is: { deletedAt: null } },
      },
      include: {
        owner: {
          select: {
            phone: true,
            contactPhone: true,
            contactPhoneVerified: true,
            isPhoneVerified: true,
            zaloUrl: true,
          },
        },
      },
    });
    if (!room) throw new NotFoundException('Listing not found.');
    if (room.ownerId === userId) {
      throw new ForbiddenException(
        'You cannot reveal contact details for your own listing.',
      );
    }
    if (type === ContactType.message) {
      throw new BadRequestException(
        'Message contact is not available until messaging is implemented.',
      );
    }

    await this.prisma.$transaction([
      this.prisma.contactLog.create({ data: { userId, roomId, type } }),
      this.prisma.room.update({
        where: { id: roomId },
        data: { contactCount: { increment: 1 } },
      }),
    ]);

    return type === ContactType.phone
      ? {
          contactPhone: room.owner.contactPhone ?? room.owner.phone,
          zaloUrl: null,
        }
      : {
          contactPhone: null,
          zaloUrl: room.owner.zaloUrl,
        };
  }

  async getStatsForOwner(userId: string, roomId: number) {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room || room.deletedAt)
      throw new NotFoundException('Listing not found.');
    if (room.ownerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to view these stats.',
      );
    }

    const grouped = await this.prisma.contactLog.groupBy({
      by: ['type'],
      where: { roomId },
      _count: { _all: true },
    });

    const byType = Object.fromEntries(
      grouped.map((g) => [g.type, g._count._all]),
    );
    const total = grouped.reduce((sum, g) => sum + g._count._all, 0);

    return { total, byType };
  }
}
