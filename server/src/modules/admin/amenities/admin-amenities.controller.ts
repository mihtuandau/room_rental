import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { AdminAmenitiesService } from './admin-amenities.service';
import { CreateAmenityDto, UpdateAmenityDto } from './dto/create-amenity.dto';

@ApiTags('admin/amenities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/amenities')
export class AdminAmenitiesController {
  constructor(private readonly adminAmenitiesService: AdminAmenitiesService) {}

  @Get()
  @ApiOperation({
    summary:
      'List the full amenity catalog, including inactive entries and usage counts',
  })
  list() {
    return this.adminAmenitiesService.list();
  }

  @Post()
  @ApiOperation({ summary: 'Add an amenity to the catalog' })
  create(@Body() dto: CreateAmenityDto) {
    return this.adminAmenitiesService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit a catalog amenity' })
  update(@Param('id') id: string, @Body() dto: UpdateAmenityDto) {
    return this.adminAmenitiesService.update(Number(id), dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a catalog amenity (removed from all listings via cascade)',
  })
  remove(@Param('id') id: string) {
    return this.adminAmenitiesService.remove(Number(id));
  }
}
