import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type FacebookProfile = {
  facebookId: string;
  email?: string;
  fullName: string;
  avatarUrl?: string;
};

const FACEBOOK_TIMEOUT_MS = 10_000;

@Injectable()
export class FacebookTokenService {
  constructor(private config: ConfigService) {}

  async verify(accessToken: string): Promise<FacebookProfile> {
    const appId = this.config.get<string>('FACEBOOK_APP_ID');
    const appSecret = this.config.get<string>('FACEBOOK_APP_SECRET');

    if (!appId || !appSecret || !accessToken) {
      throw new UnauthorizedException(
        'Facebook authentication is unavailable.',
      );
    }

    try {
      // Facebook's debug_token contract is GET with both tokens as query
      // parameters. Keep this request server-side and never log the URL.
      const debugUrl = new URL('https://graph.facebook.com/debug_token');
      debugUrl.searchParams.set('input_token', accessToken);
      debugUrl.searchParams.set('access_token', `${appId}|${appSecret}`);
      const debugRes = await fetch(debugUrl, {
        signal: AbortSignal.timeout(FACEBOOK_TIMEOUT_MS),
      });
      if (!debugRes.ok) {
        throw new UnauthorizedException('Invalid Facebook access token.');
      }

      const debugData = (await debugRes.json()) as {
        data?: { is_valid?: boolean; app_id?: string };
      };
      if (!debugData.data?.is_valid) {
        throw new UnauthorizedException(
          'Facebook access token is invalid or expired.',
        );
      }
      if (debugData.data.app_id !== appId) {
        throw new UnauthorizedException(
          'Facebook access token was not issued for this app.',
        );
      }

      const profileRes = await fetch(
        'https://graph.facebook.com/me?fields=id,name,email,picture.type(large)',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: AbortSignal.timeout(FACEBOOK_TIMEOUT_MS),
        },
      );
      if (!profileRes.ok) {
        throw new UnauthorizedException(
          'Failed to fetch Facebook user profile.',
        );
      }

      const profileData = (await profileRes.json()) as {
        id?: string;
        name?: string;
        email?: string;
        picture?: { data?: { url?: string } };
      };
      if (!profileData.id || !profileData.name) {
        throw new UnauthorizedException('Facebook profile is incomplete.');
      }

      return {
        facebookId: profileData.id,
        email: profileData.email,
        fullName: profileData.name,
        avatarUrl: profileData.picture?.data?.url,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException(
        'Facebook authentication could not be completed.',
      );
    }
  }
}
