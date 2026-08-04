import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum } from 'class-validator';
import { OtpPurpose } from '../../../../generated/prisma/client';

export class SendOtpDto {
  @ApiProperty({ example: 'you@example.com' })
  @IsEmail({}, { message: 'Invalid email address.' })
  email!: string;

  @ApiProperty({ enum: OtpPurpose })
  @IsEnum(OtpPurpose)
  purpose!: OtpPurpose;
}
