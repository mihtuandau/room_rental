import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class FeaturedLocationsQueryDto {
  @ApiPropertyOptional({
    default: 4,
    minimum: 1,
    maximum: 12,
    description: 'Number of locations to return, ranked by active listings',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  limit?: number;
}
