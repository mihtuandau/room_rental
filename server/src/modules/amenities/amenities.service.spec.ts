import { BadRequestException } from '@nestjs/common';
import { AmenitiesService } from './amenities.service';

describe('AmenitiesService', () => {
  const prisma = {
    amenity: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    room: { findUnique: jest.fn() },
    roomAmenity: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    $transaction: jest.fn().mockResolvedValue([]),
  };
  const service = new AmenitiesService(prisma as never);

  beforeEach(() => jest.clearAllMocks());

  it('returns only active amenities in the public catalog', async () => {
    prisma.amenity.findMany.mockResolvedValue([]);

    await service.list();

    expect(prisma.amenity.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true } }),
    );
  });

  it('rejects inactive amenities when replacing a listing set', async () => {
    prisma.room.findUnique.mockResolvedValue({
      id: 10,
      ownerId: 'owner-1',
      deletedAt: null,
    });
    prisma.amenity.count.mockResolvedValue(0);

    await expect(
      service.setForRoom('owner-1', 10, [99]),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.amenity.count).toHaveBeenCalledWith({
      where: { id: { in: [99] }, isActive: true },
    });
  });
});
