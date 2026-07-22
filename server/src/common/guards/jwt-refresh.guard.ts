import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Guards the refresh token cookie (see the `jwt-refresh` Passport strategy).
@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {}
