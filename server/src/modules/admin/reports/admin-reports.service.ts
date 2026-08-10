import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ReportStatus } from '../../../../generated/prisma/client';
import { ResolveReportDto } from './dto/resolve-report.dto';

@Injectable()
export class AdminReportsService {
  constructor(private prisma: PrismaService) {}

  async list(
    status: ReportStatus | undefined,
    page: number,
    pageSize: number,
    actionable = false,
  ) {
    const where = actionable
      ? { status: { in: [ReportStatus.pending, ReportStatus.reviewing] } }
      : { ...(status && { status }) };
    const [reports, total] = await this.prisma.$transaction([
      this.prisma.report.findMany({
        where,
        orderBy: { createdAt: 'asc' }, // oldest unresolved first
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          room: { select: { id: true, title: true, slug: true, status: true } },
          reporter: { select: { id: true, fullName: true, phone: true } },
          resolvedBy: { select: { id: true, fullName: true } },
        },
      }),
      this.prisma.report.count({ where }),
    ]);
    return { reports, total, page, pageSize };
  }

  async startReview(reportId: string) {
    return this.prisma.$transaction(async (tx) => {
      const report = await tx.report.findUnique({ where: { id: reportId } });
      if (!report) throw new NotFoundException('Report not found.');
      if (report.status !== ReportStatus.pending) {
        throw new BadRequestException(
          'Only a pending report can be moved to review.',
        );
      }

      const result = await tx.report.updateMany({
        where: { id: reportId, status: ReportStatus.pending },
        data: { status: ReportStatus.reviewing },
      });
      if (result.count !== 1) {
        throw new BadRequestException(
          'Report status changed. Refresh and try again.',
        );
      }

      return tx.report.findUniqueOrThrow({ where: { id: reportId } });
    });
  }

  async resolve(adminId: string, reportId: string, dto: ResolveReportDto) {
    return this.prisma.$transaction(async (tx) => {
      const report = await tx.report.findUnique({ where: { id: reportId } });
      if (!report) throw new NotFoundException('Report not found.');
      if (
        report.status === ReportStatus.resolved ||
        report.status === ReportStatus.dismissed
      ) {
        throw new BadRequestException('This report has already been closed.');
      }

      const result = await tx.report.updateMany({
        where: {
          id: reportId,
          status: { in: [ReportStatus.pending, ReportStatus.reviewing] },
        },
        data: {
          status:
            dto.status === 'resolved'
              ? ReportStatus.resolved
              : ReportStatus.dismissed,
          resolutionNote: dto.resolutionNote,
          resolvedById: adminId,
          resolvedAt: new Date(),
        },
      });
      if (result.count !== 1) {
        throw new BadRequestException(
          'Report status changed. Refresh and try again.',
        );
      }

      return tx.report.findUniqueOrThrow({
        where: { id: reportId },
        include: {
          room: { select: { id: true, title: true, slug: true, status: true } },
          reporter: { select: { id: true, fullName: true, phone: true } },
          resolvedBy: { select: { id: true, fullName: true } },
        },
      });
    });
  }
}
