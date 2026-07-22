import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ReportStatus } from '../../../generated/prisma/client';
import { CreateReportDto } from './dto/create-report.dto';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, roomId: number, dto: CreateReportDto) {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room || room.deletedAt)
      throw new NotFoundException('Listing not found.');

    // avoid piling up duplicate reports while a previous one is still open
    const openReport = await this.prisma.report.findFirst({
      where: {
        roomId,
        reporterId: userId,
        status: { in: [ReportStatus.pending, ReportStatus.reviewing] },
      },
    });
    if (openReport) {
      throw new ConflictException(
        'You already have an open report for this listing.',
      );
    }

    return this.prisma.report.create({
      data: {
        roomId,
        reporterId: userId,
        reason: dto.reason,
        description: dto.description,
      },
    });
  }

  async findMine(userId: string) {
    return this.prisma.report.findMany({
      where: { reporterId: userId },
      orderBy: { createdAt: 'desc' },
      include: { room: { select: { id: true, title: true, slug: true } } },
    });
  }
}
