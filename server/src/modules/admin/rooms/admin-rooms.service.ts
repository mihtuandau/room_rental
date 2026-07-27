import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import {
  ModerationAction,
  Prisma,
  RoomStatus,
} from '../../../../generated/prisma/client';

@Injectable()
export class AdminRoomsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async listPending(page: number, pageSize: number) {
    const where = { status: RoomStatus.pending, deletedAt: null };
    const [rooms, total] = await this.prisma.$transaction([
      this.prisma.room.findMany({
        where,
        orderBy: { createdAt: 'asc' }, // oldest waiting first
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          owner: { select: { id: true, fullName: true, phone: true } },
        },
      }),
      this.prisma.room.count({ where }),
    ]);
    return { rooms, total, page, pageSize };
  }

  async getReviewDetail(roomId: number) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: {
        images: { orderBy: { position: 'asc' } },
        amenities: { include: { amenity: true } },
        owner: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            contactPhone: true,
            zaloUrl: true,
            email: true,
            isPhoneVerified: true,
            createdAt: true,
          },
        },
        moderations: {
          orderBy: { createdAt: 'desc' },
          include: { admin: { select: { id: true, fullName: true } } },
        },
      },
    });

    if (!room || room.deletedAt) {
      throw new NotFoundException('Listing not found.');
    }

    return {
      ...room,
      amenities: room.amenities.map((roomAmenity) => roomAmenity.amenity),
    };
  }

  async approve(adminId: string, roomId: number) {
    const room = await this.getRoomOrThrow(roomId);
    if (room.status !== RoomStatus.pending) {
      throw new BadRequestException('Only a pending listing can be approved.');
    }
    const approved = await this.transitionAndLog(
      adminId,
      roomId,
      {
        status: RoomStatus.active,
        publishedAt: room.publishedAt ?? new Date(),
      },
      ModerationAction.approved,
    );
    // fire-and-forget: enqueueing is best-effort, never blocks/breaks approval
    await this.notificationsService.onRoomApproved(approved.id);
    await this.notificationsService.notifyListingApproved(approved);
    return approved;
  }

  async reject(adminId: string, roomId: number, note?: string) {
    const room = await this.getRoomOrThrow(roomId);
    if (room.status !== RoomStatus.pending) {
      throw new BadRequestException('Only a pending listing can be rejected.');
    }
    const rejected = await this.transitionAndLog(
      adminId,
      roomId,
      { status: RoomStatus.rejected },
      ModerationAction.rejected,
      note,
    );
    await this.notificationsService.notifyListingRejected(rejected, note);
    return rejected;
  }

  async hide(adminId: string, roomId: number, note?: string) {
    const room = await this.getRoomOrThrow(roomId);
    if (room.status !== RoomStatus.active) {
      throw new BadRequestException('Only an active listing can be hidden.');
    }
    return this.transitionAndLog(
      adminId,
      roomId,
      { status: RoomStatus.hidden },
      ModerationAction.hidden,
      note,
    );
  }

  async restore(adminId: string, roomId: number) {
    const room = await this.getRoomOrThrow(roomId);
    if (room.status !== RoomStatus.hidden) {
      throw new BadRequestException('Only a hidden listing can be restored.');
    }
    return this.transitionAndLog(
      adminId,
      roomId,
      { status: RoomStatus.active },
      ModerationAction.restored,
    );
  }

  async setVerified(adminId: string, roomId: number, isVerified: boolean) {
    await this.getRoomOrThrow(roomId);
    return this.prisma.room.update({
      where: { id: roomId },
      data: { isVerified, verifiedAt: isVerified ? new Date() : null },
    });
  }

  async listModerationHistory(roomId: number) {
    await this.getRoomOrThrow(roomId);
    return this.prisma.roomModeration.findMany({
      where: { roomId },
      orderBy: { createdAt: 'desc' },
      include: { admin: { select: { id: true, fullName: true } } },
    });
  }

  private async getRoomOrThrow(roomId: number) {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room || room.deletedAt)
      throw new NotFoundException('Listing not found.');
    return room;
  }

  // Every status transition is atomic with its RoomModeration audit entry —
  // never change status without recording who did it and why (CLAUDE.md §7).
  private async transitionAndLog(
    adminId: string,
    roomId: number,
    data: Prisma.RoomUpdateInput,
    action: ModerationAction,
    note?: string,
  ) {
    const [room] = await this.prisma.$transaction([
      this.prisma.room.update({ where: { id: roomId }, data }),
      this.prisma.roomModeration.create({
        data: { roomId, adminId, action, note },
      }),
    ]);
    return room;
  }
}
