import {
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
import { AdminUsersService } from './admin-users.service';
import { ListUsersQueryDto } from './dto/list-users-query.dto';

@ApiTags('admin/users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  @ApiOperation({ summary: 'List users with role, status, and keyword filters' })
  list(@Query() query: ListUsersQueryDto) {
    return this.adminUsersService.list(query);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export filtered safe user records for administrators' })
  export(@Query() query: ListUsersQueryDto) {
    return this.adminUsersService.export(query);
  }

  @Patch(':id/ban')
  @ApiOperation({ summary: 'Ban a user (soft delete + revoke all sessions)' })
  ban(@CurrentUser('id') adminId: string, @Param('id') id: string) {
    return this.adminUsersService.ban(adminId, id);
  }

  @Patch(':id/unban')
  @ApiOperation({ summary: 'Lift a ban on a user' })
  unban(@Param('id') id: string) {
    return this.adminUsersService.unban(id);
  }
}
