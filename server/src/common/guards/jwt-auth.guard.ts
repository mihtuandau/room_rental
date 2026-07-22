import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Guards the access token issued by the auth module (see the `jwt-access` Passport strategy).
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt-access') {}
