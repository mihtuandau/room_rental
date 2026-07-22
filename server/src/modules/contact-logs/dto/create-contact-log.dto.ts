import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ContactType } from '../../../../generated/prisma/client';

export class CreateContactLogDto {
  @ApiProperty({ enum: ContactType })
  @IsEnum(ContactType)
  type!: ContactType;
}
