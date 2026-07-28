import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';
import { Role } from '../../../../../generated/prisma/client';

export class ListUsersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ description: 'Match name, phone, or email' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  keyword?: string;

  @ApiPropertyOptional({ enum: ['active', 'banned'] })
  @IsOptional()
  @IsIn(['active', 'banned'])
  status?: 'active' | 'banned';

  @ApiPropertyOptional({ enum: ['none', 'any', 'active'] })
  @IsOptional()
  @IsIn(['none', 'any', 'active'])
  listing?: 'none' | 'any' | 'active';
}
