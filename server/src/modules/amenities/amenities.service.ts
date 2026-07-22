import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class AmenitiesService {
  constructor(private prisma: PrismaService) {}

  // Public catalog — powers the search filter UI and the create-listing form.
  async list() {
    return this.prisma.amenity.findMany({
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
  }

  // Replace-all semantics: the client sends the complete desired set, which is
  // simpler for a checkbox UI than add/remove one at a time.
  async setForRoom(userId: string, roomId: number, amenityIds: number[]) {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room || room.deletedAt)
      throw new NotFoundException('Listing not found.');
    if (room.ownerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to modify this listing.',
      );
    }
    const found = await this.prisma.amenity.count({
      where: { id: { in: amenityIds } },
    });
    if (found !== new Set(amenityIds).size) {
      throw new BadRequestException('One or more amenity ids do not exist.');
    }

    await this.prisma.$transaction([
      this.prisma.roomAmenity.deleteMany({ where: { roomId } }),
      this.prisma.roomAmenity.createMany({
        data: amenityIds.map((amenityId) => ({ roomId, amenityId })),
      }),
    ]);

    return this.prisma.amenity.findMany({
      where: { rooms: { some: { roomId } } },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
  }
}
