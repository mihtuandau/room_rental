import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('rooms/:id/reports')
  @Throttle({ default: { limit: 5, ttl: 60_000 } }) // anti-spam
  @ApiOperation({
    summary: 'Report a listing (fake, scam, already rented, ...)',
  })
  create(
    @CurrentUser('id') userId: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateReportDto,
  ) {
    return this.reportsService.create(userId, id, dto);
  }

  @Get('reports/mine')
  @ApiOperation({ summary: "List the current user's own submitted reports" })
  findMine(@CurrentUser('id') userId: string) {
    return this.reportsService.findMine(userId);
  }
}
