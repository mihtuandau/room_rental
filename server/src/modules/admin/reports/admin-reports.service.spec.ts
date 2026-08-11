import { BadRequestException } from '@nestjs/common';
import { ReportStatus } from '../../../../generated/prisma/client';
import { AdminReportsService } from './admin-reports.service';

describe('AdminReportsService', () => {
  const tx = {
    report: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      updateMany: jest.fn(),
    },
  };
  const prisma = {
    $transaction: jest.fn((callback: (client: typeof tx) => unknown) =>
      callback(tx),
    ),
  };
  const service = new AdminReportsService(prisma as never);

  beforeEach(() => jest.clearAllMocks());

  it('closes a report with an attributable resolution note', async () => {
    tx.report.findUnique.mockResolvedValue({
      id: 'report-1',
      status: ReportStatus.pending,
    });
    tx.report.updateMany.mockResolvedValue({ count: 1 });
    tx.report.findUniqueOrThrow.mockResolvedValue({
      id: 'report-1',
      status: ReportStatus.resolved,
      resolutionNote: 'Đã đối chiếu thông tin.',
      resolvedBy: { id: 'admin-1', fullName: 'Admin' },
    });

    await service.resolve('admin-1', 'report-1', {
      status: 'resolved',
      resolutionNote: 'Đã đối chiếu thông tin.',
    });

    expect(tx.report.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'report-1',
        status: {
          in: [ReportStatus.pending, ReportStatus.reviewing],
        },
      },
      data: {
        status: ReportStatus.resolved,
        resolutionNote: 'Đã đối chiếu thông tin.',
        resolvedById: 'admin-1',
        resolvedAt: expect.any(Date),
      },
    });
    expect(tx.report.findUniqueOrThrow).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          resolvedBy: { select: { id: true, fullName: true } },
        }),
      }),
    );
  });

  it('rejects a stale concurrent resolution', async () => {
    tx.report.findUnique.mockResolvedValue({
      id: 'report-1',
      status: ReportStatus.pending,
    });
    tx.report.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.resolve('admin-1', 'report-1', {
        status: 'dismissed',
        resolutionNote: 'Không đủ cơ sở.',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.report.findUniqueOrThrow).not.toHaveBeenCalled();
  });

  it('moves a pending report into the reviewing queue atomically', async () => {
    tx.report.findUnique.mockResolvedValue({
      id: 'report-1',
      status: ReportStatus.pending,
    });
    tx.report.updateMany.mockResolvedValue({ count: 1 });
    tx.report.findUniqueOrThrow.mockResolvedValue({
      id: 'report-1',
      status: ReportStatus.reviewing,
    });

    await expect(service.startReview('report-1')).resolves.toEqual({
      id: 'report-1',
      status: ReportStatus.reviewing,
    });
    expect(tx.report.updateMany).toHaveBeenCalledWith({
      where: { id: 'report-1', status: ReportStatus.pending },
      data: { status: ReportStatus.reviewing },
    });
  });
});
