import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { JwtRefreshGuard } from '@/common/guards/jwt-refresh.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

const REFRESH_COOKIE = 'refresh_token';
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/auth/refresh',
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Register a new user account' })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.register(dto);
    res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
    return { accessToken };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Log in with phone number + password' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.login(
      dto.phone,
      dto.password,
    );
    res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
    return { accessToken };
  }

  // Signs in (and signs up on first use) from a Google ID token the frontend
  // obtained via Google Sign-In. Returns the same shape as /auth/login, so the
  // client treats both paths identically from here on.
  @Post('google')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Log in or sign up with a Google ID token' })
  async googleLogin(
    @Body() dto: GoogleLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } =
      await this.authService.loginWithGoogle(dto.idToken);
    res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
    return { accessToken };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard)
  @ApiCookieAuth()
  @ApiOperation({
    summary: 'Reissue an access token from the refresh token cookie',
  })
  async refresh(
    @CurrentUser() user: { id: string; tokenVersion: number },
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.refresh(
      user.id,
      user.tokenVersion,
    );
    res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
    return { accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Log out — revoke every issued refresh token' })
  async logout(
    @CurrentUser('id') userId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(userId);
    res.clearCookie(REFRESH_COOKIE, { path: '/auth/refresh' });
    return { success: true };
  }

  @Post('otp/send')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60_000 } }) // anti SMS-spam
  @ApiOperation({ summary: 'Send a one-time OTP code to a phone number' })
  async sendOtp(@Body() dto: SendOtpDto) {
    await this.authService.sendOtp(dto.phone, dto.purpose);
    return { success: true };
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({
    summary:
      'Verify an OTP code (marks the phone as verified when purpose = register)',
  })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    await this.authService.verifyOtp(dto.phone, dto.purpose, dto.code);
    return { success: true };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Reset password using a verified reset_password OTP code',
  })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.phone, dto.code, dto.newPassword);
    return { success: true };
  }
}
