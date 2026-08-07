import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type FacebookProfile = {
  facebookId: string;
  email?: string;
  fullName: string;
  avatarUrl?: string;
};

@Injectable()
export class FacebookTokenService {
  constructor(private config: ConfigService) {}

  async verify(accessToken: string): Promise<FacebookProfile> {
    const appId = this.config.get<string>('FACEBOOK_APP_ID');
    const appSecret = this.config.get<string>('FACEBOOK_APP_SECRET');

    // 1. Check if the token is valid and issued for our app
    const appAccessToken = `${appId}|${appSecret}`;
    const debugUrl = `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${appAccessToken}`;
    
    const debugRes = await fetch(debugUrl);
    if (!debugRes.ok) {
      throw new UnauthorizedException('Invalid Facebook access token.');
    }
    
    const debugData = await debugRes.json();
    if (!debugData.data || !debugData.data.is_valid) {
      throw new UnauthorizedException('Facebook access token is invalid or expired.');
    }
    
    if (debugData.data.app_id !== appId) {
      throw new UnauthorizedException('Facebook access token was not issued for this app.');
    }

    // 2. Fetch the user profile
    const profileUrl = `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${accessToken}`;
    const profileRes = await fetch(profileUrl);
    
    if (!profileRes.ok) {
      throw new UnauthorizedException('Failed to fetch Facebook user profile.');
    }
    
    const profileData = await profileRes.json();
    
    return {
      facebookId: profileData.id,
      email: profileData.email,
      fullName: profileData.name,
      avatarUrl: profileData.picture?.data?.url,
    };
  }
}
