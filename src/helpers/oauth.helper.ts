import { BadRequestException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';

import { config } from '../config/config';

export interface OAuthUserInfo {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  picture?: string;
}

export class OAuthHelper {
  private static googleClient: OAuth2Client | null = null;

  private static getGoogleClient(): OAuth2Client {
    if (!this.googleClient && config.oauth.google.clientId && config.oauth.google.clientSecret) {
      this.googleClient = new OAuth2Client(
        config.oauth.google.clientId,
        config.oauth.google.clientSecret,
      );
    }
    return this.googleClient!;
  }

  static async verifyGoogleToken(accessToken: string): Promise<OAuthUserInfo> {
    try {
      const googleClient = this.getGoogleClient();
      if (!googleClient) {
        throw new BadRequestException('Google OAuth is not configured');
      }

      const ticket = await googleClient.verifyIdToken({
        idToken: accessToken,
        audience: config.oauth.google.clientId,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new BadRequestException('Invalid Google token');
      }

      return {
        id: payload.sub,
        email: payload.email!,
        firstName: payload.given_name,
        lastName: payload.family_name,
        picture: payload.picture,
      };
    } catch (error) {
      throw new BadRequestException(`Google OAuth verification failed: ${error.message}`);
    }
  }

  static async verifyFacebookToken(accessToken: string): Promise<OAuthUserInfo> {
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
        firstName: data.first_name,
        lastName: data.last_name,
        picture: data.picture?.data?.url,
      };
    } catch (error) {
      throw new BadRequestException(`Facebook OAuth verification failed: ${error.message}`);
    }
  }

  static async verifyTwitterToken(accessToken: string): Promise<OAuthUserInfo> {
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
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(' '),
      };
    } catch (error) {
      throw new BadRequestException(`Twitter OAuth verification failed: ${error.message}`);
    }
  }

  static async verifyGitHubToken(accessToken: string): Promise<OAuthUserInfo> {
    try {
      const githubApiUrl = 'https://api.github.com/user';

      const response = await fetch(githubApiUrl, {
        headers: {
          Authorization: `token ${accessToken}`,
          'User-Agent': 'NestJS-App',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new BadRequestException('Invalid GitHub token');
      }

      // Get email separately as it might be private
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `token ${accessToken}`,
          'User-Agent': 'NestJS-App',
        },
      });

      const emails = await emailResponse.json();
      const primaryEmail = emails.find((email: any) => email.primary)?.email || data.email;

      const nameParts = data.name?.split(' ') || [];

      return {
        id: data.id.toString(),
        email: primaryEmail || `${data.login}@github.placeholder`,
        firstName: nameParts[0] || data.login,
        lastName: nameParts.slice(1).join(' '),
        picture: data.avatar_url,
      };
    } catch (error) {
      throw new BadRequestException(`GitHub OAuth verification failed: ${error.message}`);
    }
  }

  static async verifyOAuthToken(provider: string, accessToken: string): Promise<OAuthUserInfo> {
    switch (provider.toLowerCase()) {
      case 'google':
        return this.verifyGoogleToken(accessToken);
      case 'facebook':
        return this.verifyFacebookToken(accessToken);
      case 'twitter':
        return this.verifyTwitterToken(accessToken);
      case 'github':
        return this.verifyGitHubToken(accessToken);
      default:
        throw new BadRequestException(`Unsupported OAuth provider: ${provider}`);
    }
  }

  static getOAuthLoginUrl(provider: string, redirectUri?: string): string {
    const baseRedirectUri = redirectUri || config.oauth.redirectUri;

    switch (provider.toLowerCase()) {
      case 'google':
        const googleClientId = config.oauth.google.clientId;
        const scopes = 'openid email profile';
        const state = Math.random().toString(36).substring(2, 15); // Generate random state for security
        return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${encodeURIComponent(baseRedirectUri)}&scope=${encodeURIComponent(scopes)}&response_type=code&access_type=offline&state=${state}`;

      case 'facebook':
        const facebookClientId = config.oauth.facebook.clientId;
        const fbScopes = 'email,public_profile';
        return `https://www.facebook.com/v18.0/dialog/oauth?client_id=${facebookClientId}&redirect_uri=${encodeURIComponent(baseRedirectUri)}&scope=${encodeURIComponent(fbScopes)}&response_type=code`;

      case 'github':
        const githubClientId = config.oauth.github.clientId;
        const ghScopes = 'user:email';
        return `https://github.com/login/oauth/authorize?client_id=${githubClientId}&redirect_uri=${encodeURIComponent(baseRedirectUri)}&scope=${encodeURIComponent(ghScopes)}`;

      case 'twitter':
        const twitterClientId = config.oauth.twitter.clientId;
        const twScopes = 'tweet.read users.read';
        return `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${twitterClientId}&redirect_uri=${encodeURIComponent(baseRedirectUri)}&scope=${encodeURIComponent(twScopes)}&state=state&code_challenge=challenge&code_challenge_method=plain`;

      default:
        throw new BadRequestException(`Unsupported OAuth provider: ${provider}`);
    }
  }

  static async exchangeCodeForToken(
    provider: string,
    code: string,
    redirectUri?: string,
  ): Promise<string> {
    const baseRedirectUri = redirectUri || config.oauth.redirectUri;

    switch (provider.toLowerCase()) {
      case 'google':
        return this.exchangeGoogleCode(code, baseRedirectUri);
      case 'facebook':
        return this.exchangeFacebookCode(code, baseRedirectUri);
      case 'github':
        return this.exchangeGitHubCode(code, baseRedirectUri);
      case 'twitter':
        return this.exchangeTwitterCode(code, baseRedirectUri);
      default:
        throw new BadRequestException(`Unsupported OAuth provider: ${provider}`);
    }
  }

  private static async exchangeGoogleCode(code: string, redirectUri: string): Promise<string> {
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const params = new URLSearchParams({
      client_id: config.oauth.google.clientId!,
      client_secret: config.oauth.google.clientSecret!,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new BadRequestException('Failed to exchange Google code for token');
    }

    return data.id_token || data.access_token;
  }

  private static async exchangeFacebookCode(code: string, redirectUri: string): Promise<string> {
    const tokenUrl = 'https://graph.facebook.com/v18.0/oauth/access_token';
    const params = new URLSearchParams({
      client_id: config.oauth.facebook.clientId!,
      client_secret: config.oauth.facebook.clientSecret!,
      code,
      redirect_uri: redirectUri,
    });

    const response = await fetch(`${tokenUrl}?${params}`);
    const data = await response.json();

    if (!response.ok) {
      throw new BadRequestException('Failed to exchange Facebook code for token');
    }

    return data.access_token;
  }

  private static async exchangeGitHubCode(code: string, redirectUri: string): Promise<string> {
    const tokenUrl = 'https://github.com/login/oauth/access_token';
    const params = {
      client_id: config.oauth.github.clientId!,
      client_secret: config.oauth.github.clientSecret!,
      code,
      redirect_uri: redirectUri,
    };

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new BadRequestException('Failed to exchange GitHub code for token');
    }

    return data.access_token;
  }

  private static async exchangeTwitterCode(code: string, redirectUri: string): Promise<string> {
    const tokenUrl = 'https://api.twitter.com/2/oauth2/token';
    const params = new URLSearchParams({
      client_id: config.oauth.twitter.clientId!,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code_verifier: 'challenge', // This should be stored and retrieved properly
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${config.oauth.twitter.clientId}:${config.oauth.twitter.clientSecret}`).toString('base64')}`,
      },
      body: params,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new BadRequestException('Failed to exchange Twitter code for token');
    }

    return data.access_token;
  }
}
