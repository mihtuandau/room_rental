import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNumberString,
  IsOptional,
  Length,
  Matches,
} from 'class-validator';
import { VN_PHONE_REGEX } from '@/common/constants/phone.constant';
import { OtpPurpose } from '../../../../generated/prisma/client';

export class VerifyOtpDto {
  @ApiProperty({ example: 'you@example.com', required: false })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email address.' })
  email?: string;

  @ApiProperty({ example: '0912345678', required: false })
  @IsOptional()
  @Matches(VN_PHONE_REGEX, { message: 'Invalid Vietnamese phone number.' })
  phone?: string;

  @ApiProperty({ enum: OtpPurpose })
  @IsEnum(OtpPurpose)
  purpose!: OtpPurpose;

  @ApiProperty({ example: '123456' })
  @IsNumberString()
  @Length(6, 6)
  code!: string;
}
