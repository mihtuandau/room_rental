import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { FavoritesService } from './favorites.service';

@ApiTags('favorites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  @ApiOperation({ summary: "List the current user's favorited rooms" })
  list(@CurrentUser('id') userId: string) {
    return this.favoritesService.list(userId);
  }

  @Post(':roomId')
  @ApiOperation({ summary: 'Favorite a room (idempotent)' })
  add(@CurrentUser('id') userId: string, @Param('roomId') roomId: string) {
    return this.favoritesService.add(userId, Number(roomId));
  }

  @Delete(':roomId')
  @ApiOperation({ summary: 'Unfavorite a room (idempotent)' })
  remove(@CurrentUser('id') userId: string, @Param('roomId') roomId: string) {
    return this.favoritesService.remove(userId, Number(roomId));
  }
}
