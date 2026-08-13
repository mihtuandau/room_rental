import { Controller, Get, Header } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AmenitiesService } from './amenities.service';

@ApiTags('amenities')
@Controller()
export class AmenitiesController {
  constructor(private readonly amenitiesService: AmenitiesService) {}

  @Get('amenities')
  @Header('Cache-Control', 'public, max-age=300, stale-while-revalidate=900')
  @ApiOperation({
    summary: 'Public amenity catalog (for search filters and the listing form)',
  })
  list() {
    return this.amenitiesService.list();
  }
}
