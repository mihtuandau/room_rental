import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { RoomStatus } from '../../../generated/prisma/client';

const COVER_IMAGE_INCLUDE = {
  images: { where: { isCover: true }, take: 1 },
} as const;

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  // Idempotent: calling this twice (a heart-icon toggle re-fired by the client)
  // must not error — just return the existing favorite.
  async add(userId: string, roomId: number) {
    const room = await this.prisma.room.findFirst({
      where: {
        id: roomId,
        status: RoomStatus.active,
        deletedAt: null,
        owner: { is: { deletedAt: null } },
      },
    });
    if (!room) throw new NotFoundException('Listing not found.');

    return this.prisma.favorite.upsert({
      where: { userId_roomId: { userId, roomId } },
      create: { userId, roomId },
      update: {},
    });
  }

  async remove(userId: string, roomId: number) {
    await this.prisma.favorite.deleteMany({ where: { userId, roomId } });
    return { success: true };
  }

  async list(userId: string) {
    const favorites = await this.prisma.favorite.findMany({
      // hide favorites pointing at rooms that are no longer publicly visible
      where: {
        userId,
        room: {
          deletedAt: null,
          status: RoomStatus.active,
          owner: { is: { deletedAt: null } },
        },
      },
      orderBy: { createdAt: 'desc' },
      include: { room: { include: COVER_IMAGE_INCLUDE } },
    });
    return favorites.map((favorite) => favorite.room);
  }
}
