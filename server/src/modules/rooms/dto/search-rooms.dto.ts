import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  IsPositive,
} from 'class-validator';
import { RoomType } from '../../../../generated/prisma/client';

const SORT_VALUES = ['newest', 'price_asc', 'price_desc'] as const;
type SortValue = (typeof SORT_VALUES)[number];

export class SearchRoomsDto {
  @ApiPropertyOptional({
    description: 'Free-text search over title/description, accent-insensitive',
  })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  keyword?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() district?: string;
  @ApiPropertyOptional({
    description:
      'Ward/commune (phường/xã) — a finer-grained filter than district',
  })
  @IsOptional()
  @IsString()
  ward?: string;
  @ApiPropertyOptional({ enum: RoomType })
  @IsOptional()
  @IsEnum(RoomType)
  roomType?: RoomType;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  priceMin?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  priceMax?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  areaMin?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  areaMax?: number;

  @ApiPropertyOptional({
    description:
      'Only return verified listings (still ranked verified-first either way)',
  })
  @IsOptional()
  @Transform(({ value }: { value: string }) => value === 'true')
  @IsBoolean()
  verifiedOnly?: boolean;

  @ApiPropertyOptional({
    type: String,
    description:
      'Comma-separated amenity ids — listings must have ALL of them (e.g. "1,3,5")',
  })
  @IsOptional()
  @Transform(({ value }: { value: string }) =>
    String(value)
      .split(',')
      .map((v) => Number(v.trim()))
  )
  @ArrayMaxSize(20)
  @ArrayUnique()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  amenityIds?: number[];

  @ApiPropertyOptional({ enum: SORT_VALUES, default: 'newest' })
  @IsOptional()
  @IsEnum(SORT_VALUES)
  sort?: SortValue = 'newest';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;
  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number = 20;
}
