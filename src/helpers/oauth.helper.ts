import { BadRequestException } from '@nestjs/common';
import { OAuthUserInfo } from '../common/entities/oauth.entity';


// OAuth Token Verification Functions
export async function verifyGoogleToken(accessToken: string): Promise<OAuthUserInfo> {
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
}

export async function verifyGitHubToken(accessToken: string): Promise<OAuthUserInfo> {
  // First, get user info
  const userResponse = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': 'ByteInbox/1.0',
      'Accept': 'application/vnd.github.v3+json',
    },
  });

  if (!userResponse.ok) {
    throw new BadRequestException('Invalid GitHub token');
  }

  const userData = await userResponse.json();

  // Get user's email addresses
  const emailResponse = await fetch('https://api.github.com/user/emails', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': 'ByteInbox/1.0',
      'Accept': 'application/vnd.github.v3+json',
    },
  });

  if (!emailResponse.ok) {
    throw new BadRequestException(
      'Unable to access email from GitHub. Please ensure the "user:email" scope is granted.'
    );
  }

  const emails = await emailResponse.json();

  // Get only the primary verified email
  const primaryEmail = emails.find((email: any) => email.primary && email.verified);

  if (!primaryEmail) {
    throw new BadRequestException(
      'No primary verified email found on your GitHub account. Please set a primary email in your GitHub settings.'
    );
  }

  const nameParts = userData.name?.split(' ') || [];

  return {
    id: userData.id.toString(),
    email: primaryEmail.email,
    name: userData.name || userData.login,
    firstName: nameParts[0] || userData.login,
    lastName: nameParts.slice(1).join(' ') || '',
    picture: userData.avatar_url,
    provider: 'github',
  };
}