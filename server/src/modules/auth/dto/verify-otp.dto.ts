import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNumberString, Length } from 'class-validator';
import { OtpPurpose } from '../../../../generated/prisma/client';

export class VerifyOtpDto {
  @ApiProperty({ example: 'you@example.com' })
  @IsEmail({}, { message: 'Invalid email address.' })
  email!: string;

  @ApiProperty({ enum: OtpPurpose })
  @IsEnum(OtpPurpose)
  purpose!: OtpPurpose;

  @ApiProperty({ example: '123456' })
  @IsNumberString()
  @Length(6, 6)
  code!: string;
}
