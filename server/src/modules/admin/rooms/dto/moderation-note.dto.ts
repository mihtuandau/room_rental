import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

// Shared body for reject/hide — both are just a status change + an optional reason.
export class ModerationNoteDto {
  @ApiPropertyOptional({
    description: 'Reason shown in the moderation history',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
