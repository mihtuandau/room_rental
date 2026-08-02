import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/prisma/prisma.service';

export interface AccessTokenPayload {
  sub: string;
  role: string;
  tokenVersion: number;
}

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(
  Strategy,
  'jwt-access',
) {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET')!,
    });
  }

  async validate(payload: AccessTokenPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { role: true, tokenVersion: true, deletedAt: true },
    });
    if (
      !user ||
      user.deletedAt ||
      user.tokenVersion !== payload.tokenVersion ||
      user.role !== payload.role
    ) {
      throw new UnauthorizedException('Session is no longer valid.');
    }
    return { id: payload.sub, role: user.role };
  }
}
