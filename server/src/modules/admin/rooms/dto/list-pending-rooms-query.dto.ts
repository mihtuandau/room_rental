import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';

export class ListPendingRoomsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search title, location, or owner contact' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  keyword?: string;

  @ApiPropertyOptional({ enum: ['verified', 'unverified'] })
  @IsOptional()
  @IsIn(['verified', 'unverified'])
  verified?: 'verified' | 'unverified';
}
