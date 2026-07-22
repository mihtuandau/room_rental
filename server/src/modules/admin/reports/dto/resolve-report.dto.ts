import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

const RESOLUTION_STATUSES = ['resolved', 'dismissed'] as const;

export class ResolveReportDto {
  @ApiProperty({ enum: RESOLUTION_STATUSES })
  @IsIn(RESOLUTION_STATUSES)
  status!: (typeof RESOLUTION_STATUSES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  resolutionNote?: string;
}
