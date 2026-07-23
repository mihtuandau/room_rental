import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ContactLogsService } from './contact-logs.service';
import { CreateContactLogDto } from './dto/create-contact-log.dto';

@ApiTags('contact-logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('rooms')
export class ContactLogsController {
  constructor(private readonly contactLogsService: ContactLogsService) {}

  @Post(':id/contact')
  @Throttle({ default: { limit: 10, ttl: 60_000 } }) // HARD RULE #8: rate limit contact reveals
  @ApiOperation({
    summary: "Reveal a landlord's contact info and log the view",
  })
  logContact(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: CreateContactLogDto,
  ) {
    return this.contactLogsService.logContact(userId, Number(id), dto.type);
  }

  @Get(':id/contact-logs/stats')
  @ApiOperation({ summary: 'Contact stats for your own listing (owner only)' })
  getStats(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.contactLogsService.getStatsForOwner(userId, Number(id));
  }
}
