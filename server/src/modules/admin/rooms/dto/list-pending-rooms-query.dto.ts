import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { RoomStatus } from '../../../../../generated/prisma/client';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';

export class ListPendingRoomsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: [RoomStatus.pending, RoomStatus.active, RoomStatus.hidden],
    default: RoomStatus.pending,
    description: 'Listing state to review or manage',
  })
  @IsOptional()
  @IsEnum(RoomStatus)
  @IsIn([RoomStatus.pending, RoomStatus.active, RoomStatus.hidden])
  status?: RoomStatus;

  @ApiPropertyOptional({
    description: 'Search title, location, or owner contact',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  keyword?: string;

  @ApiPropertyOptional({ enum: ['verified', 'unverified'] })
  @IsOptional()
  @IsIn(['verified', 'unverified'])
  verified?: 'verified' | 'unverified';
}
