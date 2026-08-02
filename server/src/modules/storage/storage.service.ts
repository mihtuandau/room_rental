import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CloudinaryService } from './cloudinary.service';
import { ROOM_IMAGE_MAX_COUNT } from './storage.constants';

@Injectable()
export class StorageService {
  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
  ) {}

  async createRoomImageSignature(userId: string, roomId: number) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      select: { ownerId: true, deletedAt: true },
    });
    if (!room || room.deletedAt) {
      throw new NotFoundException('Listing not found.');
    }
    if (room.ownerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to upload images for this listing.',
      );
    }

    const imageCount = await this.prisma.roomImage.count({ where: { roomId } });
    if (imageCount >= ROOM_IMAGE_MAX_COUNT) {
      throw new BadRequestException(
        `A listing can have at most ${ROOM_IMAGE_MAX_COUNT} images.`,
      );
    }

    return this.cloudinary.createUploadSignature(
      this.cloudinary.roomImagePrefix(userId, roomId),
    );
  }

  createAvatarSignature(userId: string) {
    return this.cloudinary.createUploadSignature(`avatars/${userId}`);
  }
}
