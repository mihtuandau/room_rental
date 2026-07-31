import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { SavedSearchesService } from './saved-searches.service';
import { CreateSavedSearchDto } from './dto/create-saved-search.dto';

@ApiTags('saved-searches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('saved-searches')
export class SavedSearchesController {
  constructor(private readonly savedSearchesService: SavedSearchesService) {}

  @Get()
  @ApiOperation({ summary: "List the current user's saved searches" })
  findMine(@CurrentUser('id') userId: string) {
    return this.savedSearchesService.findMine(userId);
  }

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({
    summary:
      'Save a search so matching new listings trigger a notification later',
  })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateSavedSearchDto) {
    return this.savedSearchesService.create(userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: "Delete one of the current user's saved searches" })
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.savedSearchesService.remove(userId, id);
  }
}
