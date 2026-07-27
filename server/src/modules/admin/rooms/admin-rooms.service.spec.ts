import { NotFoundException } from '@nestjs/common';
import { AdminRoomsService } from './admin-rooms.service';

describe('AdminRoomsService', () => {
  const prisma = {
    room: {
      findUnique: jest.fn(),
    },
  };
  const notifications = {} as never;
  const service = new AdminRoomsService(prisma as never, notifications);

  beforeEach(() => jest.clearAllMocks());

  describe('getReviewDetail', () => {
    it('returns complete review data and flattens amenities', async () => {
      const room = {
        id: 42,
        deletedAt: null,
        images: [{ id: 'image-1', position: 0 }],
        amenities: [{ amenity: { id: 7, name: 'Air conditioning' } }],
        owner: { id: 'landlord-1', fullName: 'Landlord' },
        moderations: [{ id: 'moderation-1', admin: { id: 'admin-1' } }],
      };
      prisma.room.findUnique.mockResolvedValue(room);

      await expect(service.getReviewDetail(42)).resolves.toEqual({
        ...room,
        amenities: [{ id: 7, name: 'Air conditioning' }],
      });
      expect(prisma.room.findUnique).toHaveBeenCalledWith({
        where: { id: 42 },
        include: expect.objectContaining({
          images: { orderBy: { position: 'asc' } },
          amenities: { include: { amenity: true } },
          owner: expect.any(Object),
          moderations: expect.objectContaining({
            orderBy: { createdAt: 'desc' },
          }),
        }),
      });
    });

    it('does not expose a soft-deleted listing to review', async () => {
      prisma.room.findUnique.mockResolvedValue({ id: 42, deletedAt: new Date() });

      await expect(service.getReviewDetail(42)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
