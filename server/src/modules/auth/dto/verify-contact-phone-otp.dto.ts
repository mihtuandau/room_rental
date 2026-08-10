import { ApiProperty } from '@nestjs/swagger';
import { IsNumberString, Length, Matches } from 'class-validator';
import { VN_PHONE_REGEX } from '@/common/constants/phone.constant';

export class VerifyContactPhoneOtpDto {
  @ApiProperty({ example: '0912345678' })
  @Matches(VN_PHONE_REGEX, { message: 'Invalid Vietnamese phone number.' })
  phone!: string;

  @ApiProperty({ example: '123456' })
  @IsNumberString()
  @Length(6, 6)
  code!: string;
}
