---
name: auth-jwt-refresh-otp
description: Build the auth module for the RoomRent backend — register/login with JWT access+refresh tokens, refresh token stored in a revocable httpOnly cookie, phone verification via OTP. MUST use this skill for anything related to register/login/logout/refresh token/password reset/phone verification — even when the user just says "build the login feature", "verify phone number", "user signs up". Differs from add-nest-module in that these endpoints do NOT need JwtAuthGuard (except refresh/logout) and have their own rules about cookies/token revocation that must not be skipped.
---

# Auth module (JWT access + refresh + OTP)

This is the most security-sensitive module in the project — get it wrong and "ownership checks" in every other module become meaningless, since a JWT could be forged or unrevocable.

## Mandatory principles (non-negotiable)

1. Access token: JWT signed with `JWT_ACCESS_SECRET`, short-lived (15–30 minutes), returned in the response body (frontend keeps it in memory, not localStorage).
2. Refresh token: JWT signed with `JWT_REFRESH_SECRET` (a different secret from the access token), long-lived (7–30 days), set via an **httpOnly, secure, sameSite cookie** — client-side JS can't read it.
3. Refresh token must be **revocable**: store `tokenVersion` (Int) on `User`, embed `tokenVersion` in the refresh token payload. Logout / password change → increment `tokenVersion` → every old refresh token becomes invalid automatically.
4. Password: hash with bcrypt (cost ≥ 12) or argon2, never select/return `passwordHash` anywhere.
5. Phone verification OTP: generate a 6-digit code, **hash it before storing** (same rule as passwords — never persist the raw code), TTL via `expiresAt` (5 minutes) + `usedAt` to enforce single-use + limit attempts/resends (rate limit), never log the raw code to the console in production.

## Template: related Prisma models

These already exist in `prisma/schema.prisma` — shown here for reference only, don't redefine them.

```prisma
model User {
  id            String   @id @default(cuid())
  phone         String   @unique
  passwordHash  String   @map("password_hash")
  role          Role     @default(tenant)
  tokenVersion  Int      @default(0) @map("token_version")
  isPhoneVerified Boolean @default(false) @map("is_phone_verified")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  @@map("users")
}

enum Role {
  tenant
  landlord
  admin
}

enum OtpPurpose {
  register
  reset_password
  change_phone
}

model OtpCode {
  id       String     @id @default(cuid())
  phone    String
  codeHash String     @map("code_hash")
  purpose  OtpPurpose

  expiresAt DateTime  @map("expires_at")
  usedAt    DateTime? @map("used_at")
  attempts  Int       @default(0)
  createdAt DateTime  @default(now()) @map("created_at")

  @@index([phone, purpose])
  @@index([expiresAt])
  @@map("otp_codes")
}
```

## Template: JWT payload + strategy

`src/modules/auth/strategies/jwt-access.strategy.ts`
```ts
import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";

export interface AccessTokenPayload {
  sub: string; // userId
  role: string;
}

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, "jwt-access") {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>("JWT_ACCESS_SECRET"),
    });
  }

  validate(payload: AccessTokenPayload) {
    return { id: payload.sub, role: payload.role };
  }
}
```

## Template: AuthService — login issues both tokens

```ts
import { ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async login(phone: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException("Invalid phone number or password.");
    }
    return this.issueTokens(user.id, user.role, user.tokenVersion);
  }

  async issueTokens(userId: string, role: string, tokenVersion: number) {
    const accessToken = this.jwt.sign(
      { sub: userId, role },
      { secret: this.config.get("JWT_ACCESS_SECRET"), expiresIn: this.config.get("JWT_ACCESS_EXPIRES_IN") },
    );
    const refreshToken = this.jwt.sign(
      { sub: userId, tokenVersion },
      { secret: this.config.get("JWT_REFRESH_SECRET"), expiresIn: this.config.get("JWT_REFRESH_EXPIRES_IN") },
    );
    return { accessToken, refreshToken };
  }

  async refresh(userId: string, tokenVersion: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    // an old token (from a previous logout/password change) has a mismatched tokenVersion → rejected
    if (!user || user.tokenVersion !== tokenVersion) {
      throw new ForbiddenException("Session expired, please log in again.");
    }
    return this.issueTokens(user.id, user.role, user.tokenVersion);
  }

  async logout(userId: string) {
    // increment tokenVersion → every refresh token issued before this becomes invalid immediately
    await this.prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });
  }
}
```

## Template: Controller — set/clear the refresh token cookie

```ts
import { Body, Controller, Post, Req, Res, UseGuards } from "@nestjs/common";
import { Response, Request } from "express";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { JwtRefreshGuard } from "@/common/guards/jwt-refresh.guard";
import { CurrentUser } from "@/common/decorators/current-user.decorator";

const REFRESH_COOKIE = "refresh_token";
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/auth/refresh",
};

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("login")
  @Throttle({ default: { limit: 5, ttl: 60_000 } }) // brute-force protection
  @ApiOperation({ summary: "Log in with phone number + password" })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken } = await this.authService.login(dto.phone, dto.password);
    res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
    return { accessToken };
  }

  @Post("refresh")
  @UseGuards(JwtRefreshGuard)
  @ApiOperation({ summary: "Reissue an access token from the refresh token cookie" })
  async refresh(@CurrentUser() user: { id: string; tokenVersion: number }, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken } = await this.authService.refresh(user.id, user.tokenVersion);
    res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
    return { accessToken };
  }

  @Post("logout")
  @UseGuards(JwtRefreshGuard)
  @ApiOperation({ summary: "Log out — revoke every issued refresh token" })
  async logout(@CurrentUser("id") userId: string, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(userId);
    res.clearCookie(REFRESH_COOKIE, { path: "/auth/refresh" });
    return { success: true };
  }
}
```

## Template: OTP (hashed, single-use)

```ts
import * as bcrypt from "bcrypt";
import { OtpPurpose } from "../../../generated/prisma/client";

async sendOtp(phone: string, purpose: OtpPurpose) {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const codeHash = await bcrypt.hash(code, 10);
  await this.prisma.otpCode.create({
    data: { phone, codeHash, purpose, expiresAt: new Date(Date.now() + 5 * 60_000) },
  });
  // send via SMS provider — do NOT log the raw code to the console in production
  await this.smsProvider.send(phone, `Your RoomRent verification code: ${code}`);
}

async verifyOtp(phone: string, purpose: OtpPurpose, code: string) {
  const otp = await this.prisma.otpCode.findFirst({
    where: { phone, purpose, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!otp || otp.attempts >= 5) throw new ForbiddenException("OTP code is invalid or has expired.");
  if (!(await bcrypt.compare(code, otp.codeHash))) {
    await this.prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    throw new UnauthorizedException("Incorrect OTP code.");
  }
  // single-use: mark consumed so it can't be replayed
  await this.prisma.otpCode.update({ where: { id: otp.id }, data: { usedAt: new Date() } });
  return true;
}
```

## Do NOT
- Return `refreshToken` in the response body — only ever set it via an `httpOnly` cookie.
- Sign the access token and refresh token with the same secret.
- Have logout merely clear the client-side cookie without incrementing `tokenVersion` in the DB — the old refresh token would still work if an attacker had already captured it.
- Store the raw OTP code (`code`) in the DB — only `codeHash` (bcrypt), same rule as passwords.
- Log the raw OTP code to the console/logs in production.
- Forget to rate-limit `login`, `register`, `send-otp` — these are the prime targets for brute-force/SMS spam.
- Let a used or expired OTP be verified again — always filter `usedAt: null` and mark `usedAt` on success.

## Checklist
- [ ] Access token and refresh token use different secrets and different lifetimes
- [ ] Refresh token only ever lives in an `httpOnly, secure (prod), sameSite` cookie
- [ ] `tokenVersion` on `User`, checked on refresh, incremented on logout/password change
- [ ] Password hashed with bcrypt cost ≥ 12 / argon2, never returned in a response
- [ ] OTP is stored as `codeHash` (never plaintext), has a TTL, limited attempts, single-use via `usedAt`, never logged in production
- [ ] `login`, `register`, `refresh`, `send-otp` all have `@Throttle`
