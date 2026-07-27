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

  it('filters the list by keyword, role, and active status', async () => {
    prisma.user.findMany.mockResolvedValue([]);
    prisma.user.count.mockResolvedValue(0);
    prisma.$transaction.mockResolvedValue([[], 0, 0, 0, 0]);

    await service.list({ role: 'landlord', keyword: '  An  ', status: 'active', page: 2, pageSize: 10 });

    expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        role: 'landlord',
        deletedAt: null,
        OR: expect.arrayContaining([{ fullName: { contains: 'An', mode: 'insensitive' } }]),
      }),
      skip: 10,
      take: 10,
    }));
  });

  it('exports only safe fields and caps the export at ten thousand users', async () => {
    prisma.user.findMany.mockResolvedValue([{ id: 'user-1' }]);
    prisma.user.count.mockResolvedValue(10_001);

    await expect(service.export({ status: 'banned' })).resolves.toEqual({
      users: [{ id: 'user-1' }],
      total: 10_001,
      truncated: true,
    });
    expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { deletedAt: { not: null } },
      take: 10_000,
      select: expect.objectContaining({ id: true, phone: true, fullName: true }),
    }));
  });
});
