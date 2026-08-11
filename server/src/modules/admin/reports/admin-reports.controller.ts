import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AdminReportsService } from './admin-reports.service';
import { ResolveReportDto } from './dto/resolve-report.dto';
import { ListReportsQueryDto } from './dto/list-reports-query.dto';

@ApiTags('admin/reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/reports')
export class AdminReportsController {
  constructor(private readonly adminReportsService: AdminReportsService) {}

  @Get()
  @ApiOperation({ summary: 'List reports, optionally filtered by status' })
  list(@Query() query: ListReportsQueryDto) {
    return this.adminReportsService.list(
      query.status,
      query.page ?? 1,
      query.pageSize ?? 20,
      query.actionable,
    );
  }

  @Patch(':id/start-review')
  @ApiOperation({ summary: 'Mark a pending report as being reviewed' })
  startReview(@Param('id') id: string) {
    return this.adminReportsService.startReview(id);
  }

  @Patch(':id/resolve')
  @ApiOperation({ summary: 'Close a report as resolved or dismissed' })
  resolve(
    @CurrentUser('id') adminId: string,
    @Param('id') id: string,
    @Body() dto: ResolveReportDto,
  ) {
    return this.adminReportsService.resolve(adminId, id, dto);
  }
}
