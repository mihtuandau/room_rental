import { AdminUsersService } from './admin-users.service';

describe('AdminUsersService', () => {
  const prisma = {
    user: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const service = new AdminUsersService(prisma as never);

  beforeEach(() => jest.clearAllMocks());

  it('filters by account type, listing activity, keyword, and status', async () => {
    prisma.user.findMany.mockResolvedValue([]);
    prisma.user.count.mockResolvedValue(0);
    prisma.$transaction.mockResolvedValue([[], 0, 0, 0, 0]);

    await service.list({
      role: 'user',
      listing: 'active',
      keyword: '  An  ',
      status: 'active',
      page: 2,
      pageSize: 10,
    });

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          role: 'user',
          deletedAt: null,
          rooms: {
            some: { status: 'active', deletedAt: null },
          },
          OR: expect.arrayContaining([
            { fullName: { contains: 'An', mode: 'insensitive' } },
          ]),
        }),
        skip: 10,
        take: 10,
      }),
    );
  });

  it('exports only safe fields and caps the export at ten thousand users', async () => {
    prisma.user.findMany.mockResolvedValue([
      {
        id: 'user-1',
        _count: { rooms: 2 },
        rooms: [{ id: 42 }],
      },
    ]);
    prisma.user.count.mockResolvedValue(10_001);

    await expect(service.export({ status: 'banned' })).resolves.toEqual({
      users: [
        {
          id: 'user-1',
          listingCount: 2,
          hasActiveListing: true,
        },
      ],
      total: 10_001,
      truncated: true,
    });
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { deletedAt: { not: null } },
        take: 10_000,
        select: expect.objectContaining({
          id: true,
          phone: true,
          fullName: true,
        }),
      }),
    );
  });
});
