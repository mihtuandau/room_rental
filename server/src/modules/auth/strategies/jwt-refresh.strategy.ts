import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

export interface RefreshTokenPayload {
  sub: string; // userId
  tokenVersion: number;
}

function cookieExtractor(req: Request): string | null {
  return (req?.cookies?.['refresh_token'] as string | undefined) ?? null;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: cookieExtractor,
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_REFRESH_SECRET')!,
    });
  }

  validate(payload: RefreshTokenPayload) {
    return { id: payload.sub, tokenVersion: payload.tokenVersion };
  }
}
