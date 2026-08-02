import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class RecordRoomViewDto {
  @ApiProperty({
    format: 'uuid',
    description:
      'Anonymous browser identifier used only to deduplicate room views',
  })
  @IsUUID('4')
  visitorId!: string;
}
