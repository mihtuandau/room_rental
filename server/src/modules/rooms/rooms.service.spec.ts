import { PrismaService } from '@/prisma/prisma.service';
import { CloudinaryService } from '../storage/cloudinary.service';
import { RoomsService } from './rooms.service';

describe('RoomsService', () => {
  describe('findActiveBySlug', () => {
    it('does not select owner contact details for the public response', async () => {
      const room = {
        id: 42,
        slug: 'phong-tro-quan-7',
        status: 'active',
        deletedAt: null,
        viewCount: 3,
        owner: {
          id: 'owner-1',
          fullName: 'Nguyễn Văn A',
          avatarUrl: null,
        },
        images: [],
        amenities: [],
      };
      const prisma = {
        room: {
          findFirst: jest.fn().mockResolvedValue(room),
          update: jest.fn().mockResolvedValue({ ...room, viewCount: 4 }),
        },
      };
      const service = new RoomsService(
        prisma as unknown as PrismaService,
        {} as CloudinaryService,
      );

      const result = await service.findActiveBySlug(room.slug);

      expect(prisma.room.findFirst).toHaveBeenCalledWith({
        where: {
          slug: room.slug,
          status: 'active',
          deletedAt: null,
        },
        include: {
          images: true,
          owner: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
            },
          },
          amenities: { include: { amenity: true } },
        },
      });
      expect(result.owner).toEqual({
        id: 'owner-1',
        fullName: 'Nguyễn Văn A',
        avatarUrl: null,
      });
      expect(result.owner).not.toHaveProperty('contactPhone');
      expect(result.owner).not.toHaveProperty('zaloUrl');
    });
  });
});
