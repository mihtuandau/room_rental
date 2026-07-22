import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumberString,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { OtpPurpose } from '../../../../generated/prisma/client';
import { VN_PHONE_REGEX } from '@/common/constants/phone.constant';

export class VerifyOtpDto {
  @ApiProperty({ example: '0912345678' })
  @IsString()
  @Matches(VN_PHONE_REGEX, { message: 'Invalid Vietnamese phone number.' })
  phone!: string;

  @ApiProperty({ enum: OtpPurpose })
  @IsEnum(OtpPurpose)
  purpose!: OtpPurpose;

  @ApiProperty({ example: '123456' })
  @IsNumberString()
  @Length(6, 6)
  code!: string;
}
