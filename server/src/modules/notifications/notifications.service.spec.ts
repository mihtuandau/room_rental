import { Logger } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  const queue = { add: jest.fn() };
  const prisma = {
    notification: {
      create: jest.fn(),
    },
  };
  const service = new NotificationsService(queue as never, prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => jest.restoreAllMocks());

  it('does not fail approval when the owner notification cannot be stored', async () => {
    prisma.notification.create.mockRejectedValue(new Error('database down'));

    await expect(
      service.notifyListingApproved({
        id: 42,
        ownerId: 'owner-1',
        title: 'Room',
      }),
    ).resolves.toBeUndefined();
  });

  it('does not fail rejection when the owner notification cannot be stored', async () => {
    prisma.notification.create.mockRejectedValue(new Error('database down'));

    await expect(
      service.notifyListingRejected(
        { id: 42, ownerId: 'owner-1', title: 'Room' },
        'Thiếu thông tin.',
      ),
    ).resolves.toBeUndefined();
  });
});
