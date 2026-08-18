import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AdminRoomsService } from './admin-rooms.service';
import { ModerationNoteDto } from './dto/moderation-note.dto';
import { SetVerifiedDto } from './dto/set-verified.dto';
import { ListPendingRoomsQueryDto } from './dto/list-pending-rooms-query.dto';

@ApiTags('admin/rooms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/rooms')
export class AdminRoomsController {
  constructor(private readonly adminRoomsService: AdminRoomsService) {}

  @Get('pending')
  @ApiOperation({ summary: 'List listings awaiting approval, oldest first' })
  listPending(@Query() query: ListPendingRoomsQueryDto) {
    return this.adminRoomsService.listPending(
      query.page ?? 1,
      query.pageSize ?? 20,
      query.keyword,
      query.verified,
      query.status,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary:
      'Full listing review detail, including images, amenities, owner contact, and moderation history',
  })
  getReviewDetail(@Param('id', ParseIntPipe) id: number) {
    return this.adminRoomsService.getReviewDetail(id);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve a pending listing (pending → active)' })
  approve(
    @CurrentUser('id') adminId: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminRoomsService.approve(adminId, id);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject a pending listing (pending → rejected)' })
  reject(
    @CurrentUser('id') adminId: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ModerationNoteDto,
  ) {
    return this.adminRoomsService.reject(adminId, id, dto.note);
  }

  @Patch(':id/hide')
  @ApiOperation({ summary: 'Hide an active listing (active → hidden)' })
  hide(
    @CurrentUser('id') adminId: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ModerationNoteDto,
  ) {
    return this.adminRoomsService.hide(adminId, id, dto.note);
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore a hidden listing (hidden → active)' })
  restore(
    @CurrentUser('id') adminId: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminRoomsService.restore(adminId, id);
  }

  @Patch(':id/verified')
  @ApiOperation({ summary: 'Toggle the verified badge on a listing' })
  setVerified(
    @CurrentUser('id') adminId: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetVerifiedDto,
  ) {
    return this.adminRoomsService.setVerified(adminId, id, dto.isVerified);
  }

  @Get(':id/moderations')
  @ApiOperation({ summary: 'Moderation history for a listing (audit trail)' })
  listModerationHistory(@Param('id', ParseIntPipe) id: number) {
    return this.adminRoomsService.listModerationHistory(id);
  }
}
