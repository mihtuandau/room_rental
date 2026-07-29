import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ReportStatus, RoomStatus } from '../../../../generated/prisma/client';

const VIETNAM_UTC_OFFSET_MS = 7 * 60 * 60 * 1000;

export function getVietnamStartOfDay(now = new Date()) {
  const vietnamTime = new Date(now.getTime() + VIETNAM_UTC_OFFSET_MS);
  vietnamTime.setUTCHours(0, 0, 0, 0);
  return new Date(vietnamTime.getTime() - VIETNAM_UTC_OFFSET_MS);
}

@Injectable()
export class AdminDashboardService {
  constructor(private prisma: PrismaService) {}

  async getSummary() {
    const startOfToday = getVietnamStartOfDay();

    const [pendingRooms, pendingReports, newUsersToday] = await Promise.all([
      this.prisma.room.count({
        where: { status: RoomStatus.pending, deletedAt: null },
      }),
      this.prisma.report.count({ where: { status: ReportStatus.pending } }),
      this.prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
    ]);

    return { pendingRooms, pendingReports, newUsersToday };
  }
}
