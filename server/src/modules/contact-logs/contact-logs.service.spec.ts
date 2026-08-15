import { ContactType } from '../../../generated/prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { ContactLogsService } from './contact-logs.service';

describe('ContactLogsService', () => {
  it('returns only the requested contact channel', async () => {
    const prisma = {
      room: {
        findFirst: jest.fn().mockResolvedValue({
          id: 42,
          ownerId: 'owner-1',
          owner: {
            phone: '0912345678',
            contactPhone: '0987654321',
            contactPhoneVerified: true,
            isPhoneVerified: true,
            zaloUrl: 'https://zalo.me/owner-1',
          },
        }),
        update: jest.fn(),
      },
      contactLog: { create: jest.fn() },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    const service = new ContactLogsService(prisma as unknown as PrismaService);

    await expect(
      service.logContact('tenant-1', 42, ContactType.phone),
    ).resolves.toEqual({
      contactPhone: '0987654321',
      zaloUrl: null,
    });
  });

  it('rejects self-contact', async () => {
    const prisma = {
      room: {
        findFirst: jest.fn().mockResolvedValue({
          id: 42,
          ownerId: 'owner-1',
          owner: {
            phone: '0912345678',
            contactPhone: null,
            contactPhoneVerified: false,
            isPhoneVerified: true,
            zaloUrl: null,
          },
        }),
        update: jest.fn(),
      },
    };
    const service = new ContactLogsService(prisma as unknown as PrismaService);

    await expect(
      service.logContact('owner-1', 42, ContactType.phone),
    ).rejects.toThrow('own listing');
  });

  it('reveals a listing phone to a signed-in viewer even when it is unverified', async () => {
    const prisma = {
      room: {
        findFirst: jest.fn().mockResolvedValue({
          id: 42,
          ownerId: 'owner-1',
          owner: {
            phone: '0912345678',
            contactPhone: '0987654321',
            contactPhoneVerified: false,
            isPhoneVerified: true,
            zaloUrl: null,
          },
        }),
        update: jest.fn(),
      },
      contactLog: { create: jest.fn() },
      $transaction: jest.fn(),
    };
    const service = new ContactLogsService(prisma as unknown as PrismaService);

    await expect(
      service.logContact('tenant-1', 42, ContactType.phone),
    ).resolves.toEqual({
      contactPhone: '0987654321',
      zaloUrl: null,
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });
});
