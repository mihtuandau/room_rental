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

  async list(status: ReportStatus | undefined, page: number, pageSize: number) {
    const where = { ...(status && { status }) };
    const [reports, total] = await this.prisma.$transaction([
      this.prisma.report.findMany({
        where,
        orderBy: { createdAt: 'asc' }, // oldest unresolved first
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          room: { select: { id: true, title: true, slug: true, status: true } },
          reporter: { select: { id: true, fullName: true, phone: true } },
        },
      }),
      this.prisma.report.count({ where }),
    ]);
    return { reports, total, page, pageSize };
  }

  async resolve(adminId: string, reportId: string, dto: ResolveReportDto) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });
    if (!report) throw new NotFoundException('Report not found.');
    if (
      report.status === ReportStatus.resolved ||
      report.status === ReportStatus.dismissed
    ) {
      throw new BadRequestException('This report has already been closed.');
    }

    return this.prisma.report.update({
      where: { id: reportId },
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
  }
}
