import { BadRequestException } from '@nestjs/common';
import { OAuthUserInfo } from '../common/entities/oauth.entity';


// OAuth Token Verification Functions
export async function verifyGoogleToken(accessToken: string): Promise<OAuthUserInfo> {
  try {
    // Use the access token to get user info from Google's userinfo endpoint
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new BadRequestException('Failed to fetch user info from Google');
    }

    const data = await response.json();

    return {
      id: data.id,
      email: data.email,
      name: data.name || `${data.given_name} ${data.family_name}`.trim(),
      firstName: data.given_name,
      lastName: data.family_name,
      picture: data.picture,
      provider: 'google',
    };
  } catch (error) {
    throw new BadRequestException(`Google OAuth verification failed: ${error.message}`);
  }
}

export async function verifyGitHubToken(accessToken: string): Promise<OAuthUserInfo> {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'YourApp/1.0',
      },
    });

    if (!response.ok) {
      throw new BadRequestException('Invalid GitHub token');
    }

    const data = await response.json();
    const nameParts = data.name?.split(' ') || [];

    return {
      id: data.id.toString(),
      email: data.email || `${data.login}@github.placeholder`,
      name: data.name || data.login,
      firstName: nameParts[0],
      lastName: nameParts.slice(1).join(' '),
      picture: data.avatar_url,
      provider: 'github',
    };
  } catch (error) {
    throw new BadRequestException(`GitHub OAuth verification failed: ${error.message}`);
  }
}