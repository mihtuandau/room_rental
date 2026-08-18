import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisCacheService } from '@/common/cache/redis-cache.service';
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
    @Optional() private cache?: RedisCacheService,
  ) {}

  async listPending(
    page: number,
    pageSize: number,
    keyword?: string,
    verified?: 'verified' | 'unverified',
    status: RoomStatus = RoomStatus.pending,
  ) {
    const search = keyword?.trim();
    const where: Prisma.RoomWhereInput = {
      status,
      deletedAt: null,
      ...(verified ? { isVerified: verified === 'verified' } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { city: { contains: search, mode: 'insensitive' } },
              { district: { contains: search, mode: 'insensitive' } },
              { ward: { contains: search, mode: 'insensitive' } },
              { address: { contains: search, mode: 'insensitive' } },
              {
                owner: {
                  is: {
                    OR: [
                      { fullName: { contains: search, mode: 'insensitive' } },
                      { phone: { contains: search, mode: 'insensitive' } },
                      { email: { contains: search, mode: 'insensitive' } },
                    ],
                  },
                },
              },
            ],
          }
        : {}),
    };
    const [rooms, total] = await this.prisma.$transaction([
      this.prisma.room.findMany({
        where,
        orderBy: { createdAt: 'asc' }, // oldest waiting first
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          title: true,
          price: true,
          roomType: true,
          status: true,
          city: true,
          district: true,
          ward: true,
          createdAt: true,
          isVerified: true,
          images: { where: { isCover: true }, take: 1, select: { url: true } },
          owner: {
            select: { id: true, fullName: true, phone: true, email: true },
          },
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
    const approved = await this.transitionAndLog(
      adminId,
      roomId,
      RoomStatus.pending,
      (room) => ({
        status: RoomStatus.active,
        publishedAt: room.publishedAt ?? new Date(),
      }),
      ModerationAction.approved,
      undefined,
      'Only a pending listing can be approved.',
    );
    // Both notification paths are best-effort and log their own failures.
    await this.notificationsService.onRoomApproved(approved.id);
    await this.notificationsService.notifyListingApproved(approved);
    return approved;
  }

  async reject(adminId: string, roomId: number, note?: string) {
    const rejected = await this.transitionAndLog(
      adminId,
      roomId,
      RoomStatus.pending,
      { status: RoomStatus.rejected },
      ModerationAction.rejected,
      note,
      'Only a pending listing can be rejected.',
    );
    await this.notificationsService.notifyListingRejected(rejected, note);
    return rejected;
  }

  async hide(adminId: string, roomId: number, note?: string) {
    return this.transitionAndLog(
      adminId,
      roomId,
      RoomStatus.active,
      { status: RoomStatus.hidden },
      ModerationAction.hidden,
      note,
      'Only an active listing can be hidden.',
    );
  }

  async restore(adminId: string, roomId: number) {
    return this.transitionAndLog(
      adminId,
      roomId,
      RoomStatus.hidden,
      { status: RoomStatus.active },
      ModerationAction.restored,
      undefined,
      'Only a hidden listing can be restored.',
    );
  }

  async setVerified(adminId: string, roomId: number, isVerified: boolean) {
    const updated = await this.prisma.$transaction(async (tx) => {
      const room = await tx.room.findUnique({ where: { id: roomId } });
      if (!room || room.deletedAt) {
        throw new NotFoundException('Listing not found.');
      }
      if (
        room.status !== RoomStatus.pending &&
        room.status !== RoomStatus.active
      ) {
        throw new BadRequestException(
          'Only pending or active listings can be verified.',
        );
      }
      if (room.isVerified === isVerified) return room;

      const result = await tx.room.updateMany({
        where: {
          id: roomId,
          deletedAt: null,
          isVerified: room.isVerified,
        },
        data: { isVerified, verifiedAt: isVerified ? new Date() : null },
      });
      if (result.count !== 1) {
        throw new BadRequestException(
          'Listing verification changed. Refresh and try again.',
        );
      }

      await tx.roomModeration.create({
        data: {
          roomId,
          adminId,
          action: isVerified
            ? ModerationAction.verified
            : ModerationAction.unverified,
        },
      });
      return tx.room.findUniqueOrThrow({ where: { id: roomId } });
    });
    await this.cache?.deleteByPrefix('roomrent:cache:rooms:');
    return updated;
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
    expectedStatus: RoomStatus,
    data:
      | Prisma.RoomUpdateManyMutationInput
      | ((room: {
          publishedAt: Date | null;
        }) => Prisma.RoomUpdateManyMutationInput),
    action: ModerationAction,
    note?: string,
    invalidStatusMessage = 'Listing cannot be changed from its current state.',
  ) {
    const transitioned = await this.prisma.$transaction(async (tx) => {
      const room = await tx.room.findUnique({ where: { id: roomId } });
      if (!room || room.deletedAt) {
        throw new NotFoundException('Listing not found.');
      }
      if (room.status !== expectedStatus) {
        throw new BadRequestException(invalidStatusMessage);
      }

      const result = await tx.room.updateMany({
        where: { id: roomId, status: expectedStatus, deletedAt: null },
        data: typeof data === 'function' ? data(room) : data,
      });
      if (result.count !== 1) {
        throw new BadRequestException(
          'Listing status changed. Refresh and try again.',
        );
      }

      await tx.roomModeration.create({
        data: { roomId, adminId, action, note },
      });
      return tx.room.findUniqueOrThrow({ where: { id: roomId } });
    });
    await this.cache?.deleteByPrefix('roomrent:cache:rooms:');
    return transitioned;
  }
}
