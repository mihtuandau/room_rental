import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { GoogleTokenService } from './google/google-token.service';
import { FacebookTokenService } from './facebook/facebook-token.service';
import { EmailService } from './email/email.service';
import { SmsService } from './sms/sms.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  // JwtModule.register({}) with no default secret/options: AuthService signs
  // access and refresh tokens explicitly with their own secret per call.
  imports: [PassportModule, JwtModule.register({}), StorageModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAccessStrategy,
    JwtRefreshStrategy,
    GoogleTokenService,
    FacebookTokenService,
    EmailService,
    SmsService,
  ],
})
export class AuthModule {}
