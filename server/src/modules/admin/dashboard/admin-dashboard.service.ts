import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ReportStatus, RoomStatus } from '../../../../generated/prisma/client';

@Injectable()
export class AdminDashboardService {
  constructor(private prisma: PrismaService) {}

  async getSummary() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

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
