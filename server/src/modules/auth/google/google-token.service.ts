import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';

export interface GoogleProfile {
  googleId: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
}

@Injectable()
export class GoogleTokenService {
  private readonly client: OAuth2Client;
  private readonly clientId: string;

  constructor(config: ConfigService) {
    this.clientId = config.get<string>('GOOGLE_CLIENT_ID')!;
    this.client = new OAuth2Client(this.clientId);
  }

  // Verifies the ID token the frontend obtained from Google Sign-In: checks the
  // signature against Google's public keys, the issuer, the expiry, and that the
  // token was actually minted for *our* client id (guards against a token
  // borrowed from another app).
  async verify(idToken: string): Promise<GoogleProfile> {
    let payload;
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: this.clientId,
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Invalid Google token.');
    }

    if (!payload?.sub || !payload.email) {
      throw new UnauthorizedException(
        'Google token is missing required profile fields.',
      );
    }
    if (!payload.email_verified) {
      throw new UnauthorizedException(
        'This Google account has an unverified email address.',
      );
    }

    return {
      googleId: payload.sub,
      email: payload.email,
      fullName: payload.name,
      avatarUrl: payload.picture,
    };
  }
}
