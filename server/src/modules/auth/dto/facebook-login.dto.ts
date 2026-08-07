import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class FacebookLoginDto {
  @ApiProperty({
    description: 'Access token returned by Facebook Login on the frontend',
  })
  @IsString()
  accessToken!: string;
}
