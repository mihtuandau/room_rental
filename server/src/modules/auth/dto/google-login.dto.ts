import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class GoogleLoginDto {
  @ApiProperty({
    description: 'ID token returned by Google Sign-In on the frontend',
  })
  @IsString()
  idToken!: string;
}
