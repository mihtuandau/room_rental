import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';
import { VN_PHONE_REGEX } from '@/common/constants/phone.constant';

export class LoginDto {
  @ApiProperty({ example: '0912345678' })
  @IsString()
  @Matches(VN_PHONE_REGEX, { message: 'Invalid Vietnamese phone number.' })
  phone!: string;

  @ApiProperty()
  @IsString()
  password!: string;
}
