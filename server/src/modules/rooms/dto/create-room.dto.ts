import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RoomType } from '../../../../generated/prisma/client';

export class CreateRoomDto {
  @ApiProperty({ minLength: 10, maxLength: 120 })
  @IsString()
  @Length(10, 120)
  title!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Length(0, 3000)
  description?: string;

  @ApiProperty({ enum: RoomType })
  @IsEnum(RoomType)
  roomType!: RoomType;

  @ApiProperty({ description: 'VND' })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  price!: number;

  @ApiProperty({ required: false, description: 'm²' })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  area?: number;

  @ApiProperty({ required: false, description: 'VND' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  deposit?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(20)
  bedrooms?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(20)
  bathrooms?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  maxOccupants?: number;

  @ApiProperty()
  @IsString()
  @Length(2, 100)
  city!: string;

  @ApiProperty()
  @IsString()
  @Length(2, 100)
  district!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  ward?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Length(1, 300)
  address?: string;

  @ApiProperty({ required: false, minimum: -90, maximum: 90 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiProperty({ required: false, minimum: -180, maximum: 180 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(-180)
  @Max(180)
  longitude?: number;
}
