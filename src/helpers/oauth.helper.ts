import { BadRequestException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';


import { config } from '../config/config';
import { OAuthUserInfo } from '../common/entities/oauth.entity';

// OAuth Client Factory (Stateless)
function createGoogleClient(): OAuth2Client {
  if (!config.oauth.google.clientId || !config.oauth.google.clientSecret) {
    throw new BadRequestException('Google OAuth not configured');
  }
  
  return new OAuth2Client(
    config.oauth.google.clientId,
    config.oauth.google.clientSecret,
  );
}

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

export async function verifyFacebookToken(accessToken: string): Promise<OAuthUserInfo> {
  try {
    const facebookApiUrl = `https://graph.facebook.com/me?fields=id,email,first_name,last_name,picture&access_token=${accessToken}`;

    const response = await fetch(facebookApiUrl);
    const data = await response.json();

    if (!response.ok || data.error) {
      throw new BadRequestException('Invalid Facebook token');
    }

    return {
      id: data.id,
      email: data.email,
      name: `${data.first_name} ${data.last_name}`.trim(),
      firstName: data.first_name,
      lastName: data.last_name,
      picture: data.picture?.data?.url,
      provider: 'facebook',
    };
  } catch (error) {
    throw new BadRequestException(`Facebook OAuth verification failed: ${error.message}`);
  }
}

export async function verifyTwitterToken(accessToken: string): Promise<OAuthUserInfo> {
  try {
    const twitterApiUrl = 'https://api.twitter.com/2/users/me?user.fields=id,username,name,email';

    const response = await fetch(twitterApiUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok || data.errors) {
      throw new BadRequestException('Invalid Twitter token');
    }

    const user = data.data;
    const nameParts = user.name?.split(' ') || [];

    return {
      id: user.id,
      email: user.email || `${user.username}@twitter.placeholder`,
      name: user.name || user.username,
      firstName: nameParts[0],
      lastName: nameParts.slice(1).join(' '),
      provider: 'twitter',
    };
  } catch (error) {
    throw new BadRequestException(`Twitter OAuth verification failed: ${error.message}`);
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

export async function verifyOAuthToken(provider: string, accessToken: string): Promise<OAuthUserInfo> {
  switch (provider.toLowerCase()) {
    case 'google':
      return await verifyGoogleToken(accessToken);
    case 'facebook':
      return await verifyFacebookToken(accessToken);
    case 'twitter':
      return await verifyTwitterToken(accessToken);
    case 'github':
      return await verifyGitHubToken(accessToken);
    default:
      throw new BadRequestException(`Unsupported OAuth provider: ${provider}`);
  }
}

// OAuth URL Generation Functions
export function getOAuthLoginUrl(provider: string): string {
  const redirectUri = config.oauth.redirectUri;
  
  switch (provider.toLowerCase()) {
    case 'google':
      const googleClient = createGoogleClient();
      return googleClient.generateAuthUrl({
        access_type: 'offline',
        scope: ['email', 'profile'],
        redirect_uri: redirectUri,
      });
      
    case 'facebook':
      return `https://www.facebook.com/v12.0/dialog/oauth?client_id=${config.oauth.facebook.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=email,public_profile&response_type=code`;
      
    case 'twitter':
      return `https://twitter.com/i/oauth2/authorize?client_id=${config.oauth.twitter.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=tweet.read%20users.read%20offline.access&response_type=code&code_challenge_method=S256&code_challenge=${generateCodeChallenge()}`;
      
    case 'github':
      return `https://github.com/login/oauth/authorize?client_id=${config.oauth.github.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email&response_type=code`;
      
    default:
      throw new BadRequestException(`Unsupported OAuth provider: ${provider}`);
  }
}

function generateCodeChallenge(): string {
  // Simple implementation - in production, use PKCE
  return require('crypto').randomBytes(32).toString('base64url');
}

// OAuth Code Exchange Functions
export async function exchangeCodeForToken(
  provider: string,
  code: string,
): Promise<string> {
  const redirectUri = config.oauth.redirectUri;
  
  switch (provider.toLowerCase()) {
    case 'google':
      return await exchangeGoogleCode(code, redirectUri);
    case 'facebook':
      return await exchangeFacebookCode(code, redirectUri);
    case 'github':
      return await exchangeGitHubCode(code, redirectUri);
    case 'twitter':
      return await exchangeTwitterCode(code, redirectUri);
    default:
      throw new BadRequestException(`Unsupported OAuth provider: ${provider}`);
  }
}

async function exchangeGoogleCode(code: string, redirectUri: string): Promise<string> {
  const googleClient = createGoogleClient();
  
  const { tokens } = await googleClient.getToken({
    code,
    redirect_uri: redirectUri,
  });
  
  if (!tokens.access_token) {
    throw new BadRequestException('Failed to get access token from Google');
  }
  
  return tokens.access_token;
}

async function exchangeFacebookCode(code: string, redirectUri: string): Promise<string> {
  const response = await fetch('https://graph.facebook.com/v12.0/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: config.oauth.facebook.clientId!,
      client_secret: config.oauth.facebook.clientSecret!,
      code,
      redirect_uri: redirectUri,
    }),
  });
  
  const data = await response.json();
  
  if (!response.ok || data.error) {
    throw new BadRequestException('Failed to exchange Facebook code for token');
  }
  
  return data.access_token;
}

async function exchangeGitHubCode(code: string, redirectUri: string): Promise<string> {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: config.oauth.github.clientId,
      client_secret: config.oauth.github.clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });
  
  const data = await response.json();
  
  if (!response.ok || data.error) {
    throw new BadRequestException('Failed to exchange GitHub code for token');
  }
  
  return data.access_token;
}

async function exchangeTwitterCode(code: string, redirectUri: string): Promise<string> {
  const response = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${config.oauth.twitter.clientId}:${config.oauth.twitter.clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      code_verifier: generateCodeVerifier(), // In production, store this securely
    }),
  });
  
  const data = await response.json();
  
  if (!response.ok || data.error) {
    throw new BadRequestException('Failed to exchange Twitter code for token');
  }
  
  return data.access_token;
}

function generateCodeVerifier(): string {
  return require('crypto').randomBytes(32).toString('base64url');
}

// OAuth User Management Functions
export async function findOrCreateOAuthUser(
  provider: string,
  oauthUserInfo: OAuthUserInfo,
  accessToken: string,
  authRepository: any,
): Promise<any> {
  // Check if user exists by OAuth provider ID
  let user = await authRepository.findUserByOAuthId(provider, oauthUserInfo.id);
  
  if (!user) {
    // Check if user exists by email
    user = await authRepository.findUserByEmail(oauthUserInfo.email);
    
    if (user) {
      // Link existing user to OAuth provider
      await authRepository.linkOAuthAccount(user.id, provider, oauthUserInfo.id, accessToken);
    } else {
      // Create new user
      user = await authRepository.createOAuthUser({
        email: oauthUserInfo.email,
        firstName: oauthUserInfo.firstName,
        lastName: oauthUserInfo.lastName,
        isEmailVerified: true, // OAuth users are pre-verified
        oauthProvider: provider,
        oauthProviderId: oauthUserInfo.id,
        oauthAccessToken: accessToken,
      });
    }
  } else {
    // Update OAuth access token
    await authRepository.updateOAuthAccessToken(user.id, provider, accessToken);
  }
  
  return user;
}
