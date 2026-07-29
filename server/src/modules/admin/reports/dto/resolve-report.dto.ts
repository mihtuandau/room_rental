import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';

const RESOLUTION_STATUSES = ['resolved', 'dismissed'] as const;

export class ResolveReportDto {
  @ApiProperty({ enum: RESOLUTION_STATUSES })
  @IsIn(RESOLUTION_STATUSES)
  status!: (typeof RESOLUTION_STATUSES)[number];

  @ApiProperty({
    description: 'Audit note describing the review outcome',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  resolutionNote!: string;
}
