import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from '../../repositories/user.repository';
import { SessionRepository } from '../../repositories/session.repository';
import { BackupCodeRepository } from '../../repositories/backup-code.repository';
import { OAuthAccountRepository } from '../../repositories/oauth-account.repository';
import { LocalAuthAccountRepository } from '../../repositories/local-auth-account.repository';
import { VerificationRequestRepository } from '../../repositories/verification-request.repository';
import { TeamRepository } from '../../repositories/team.repository';
import { AuthValidator } from './auth.validator';
import { generateSuccessResponse } from '../../utils/util';
import { handleServiceError } from '../../utils/error.util';
import { generateTokens, hashPassword } from '../../utils/authentication.util';
import { generateSessionToken, setupTotp, generateBackupCodes, hashBackupCode, maskBackupCode } from '../../helpers/mfa.helper';
import { randomBytes } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { OAuth2Client } from 'google-auth-library';
import { config } from '../../config/config';
import * as moment from 'moment';
import { verifyGoogleToken, verifyGitHubToken } from '../../helpers/oauth.helper';
import { OAuthProvider, Constants, UserStatus } from '../../common/enums/generic.enum';
import { LoginDto, LoginResponseDto, OAuthCallbackDto, OAuthLoginResponseDto, LogoutDto, RefreshTokenDto, ResetPasswordRequestDto, ResetPasswordConfirmDto, ChangePasswordDto, RegisterDto, VerifyEmailDto, ResendVerificationDto, MfaVerifyDto, MfaChallengeDto, MfaBackupCodeConsumeDto, MfaDisableDto, MfaRegenerateBackupCodesDto, TotpSetupResponseDto, TotpVerifySetupResponseDto, BackupCodesResponseDto, RegenerateBackupCodesResponseDto } from './dto/auth.dto';
import { generateUniqueTeamSlug } from '../../utils/team.util';
import prisma from '../../common/prisma';
import { MfaMethod, MfaVerificationSessionStatus, VerificationRequestType } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly backupCodeRepository: BackupCodeRepository,
    private readonly oauthAccountRepository: OAuthAccountRepository,
    private readonly localAuthAccountRepository: LocalAuthAccountRepository,
    private readonly verificationRequestRepository: VerificationRequestRepository,
    private readonly teamRepository: TeamRepository,
    private readonly authValidator: AuthValidator,
    private readonly jwtService: JwtService,
  ) { }

  async login(loginDto: LoginDto, request: any): Promise<any> {
    try {
      // Validate login data
      const { user } = await this.authValidator.validateLogin(loginDto);

      // Check if user has MFA enabled
      if (user.totpEnabled) {
        // Generate session token for MFA verification
        const sessionToken = generateSessionToken();

        // Store MFA verification session temporarily
        await prisma.mfaVerificationSession.create({
          data: {
            userId: user.id,
            email: user.email,
            mfaMethod: MfaMethod.TOTP,
            sessionToken: sessionToken,
            expiresAt: moment().add(10, 'minutes').toDate(),
            status: MfaVerificationSessionStatus.pending,
          },
        });

        return generateSuccessResponse({
          statusCode: HttpStatus.OK,
          message: Constants.requiresTwoFactor,
          data: {
            requiresTwoFactor: true,
            sessionToken,
          },
        });
      }

      // Generate tokens
      const tokens = await generateTokens(user, this.jwtService);
      const { accessToken, refreshToken } = tokens;

      // Create session
      await this.sessionRepository.createSession({
        userId: user.id,
        token: refreshToken,
        expiresAt: moment().add(7, 'days').toDate(),
        isRevoked: false,
      });

      // Get user's personal team
      const personalTeam = await this.teamRepository.findUserPersonalTeam(user.id);
      if (!personalTeam) {
        throw new Error('Personal team not found for user');
      }

      const response: LoginResponseDto = {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          photoUrl: user.photoUrl,
          isEmailVerified: !!user.emailVerifiedAt,
          status: user.status,
        },
        defaultTeam: {
          id: personalTeam.id,
          reference: personalTeam.reference,
          name: personalTeam.name,
          slug: personalTeam.slug,
        },
      };

      return generateSuccessResponse({
        statusCode: 200,
        message: 'Login successful',
        data: response,
      });
    } catch (error) {
      return handleServiceError('Login failed', error);
    }
  }

  async register(registerDto: RegisterDto, request: any): Promise<any> {
    try {
      // Validate registration data
      const validatedData = await this.authValidator.validateRegister(registerDto);

      // Hash the password
      const hashedPassword = await hashPassword(validatedData.password);

      // Generate unique team slug
      const teamNameAndSlugInfo = await generateUniqueTeamSlug(validatedData.email);

      // Generate email verification token
      const emailVerificationToken = randomBytes(32).toString('hex');
      const emailVerificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create new user
      const user = await this.userRepository.createLocalAuthUserAndPersonalTeam({
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
        isEmailVerified: false,
        status: UserStatus.inactive,
        teamName: teamNameAndSlugInfo.name,
        teamSlug: teamNameAndSlugInfo.slug,
        emailVerificationToken,
        emailVerificationExpiresAt,
      });

      // TODO: Send email verification email
      console.log(`Email verification needed for ${user.email}`);

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'Account registered successfully. Please check your email to verify your email.',
        data: {
          email: user.email,
          verificationRequired: true,
        },
      });
    } catch (error) {
      return handleServiceError('Registration failed', error);
    }
  }

  async getGoogleOAuthUrl(): Promise<any> {
    try {
      // Create Google OAuth client
      const googleClient = new OAuth2Client(
        config.oauth.google.clientId,
        config.oauth.google.clientSecret,
        config.oauth.redirectUri
      );

      // Generate Google OAuth URL
      const oauthUrl = googleClient.generateAuthUrl({
        access_type: 'offline',
        scope: ['email', 'profile'],
        redirect_uri: config.oauth.redirectUri,
        state: randomBytes(32).toString('hex'),
      });

      return generateSuccessResponse({
        statusCode: 200,
        message: Constants.successMessage,
        data: {
          provider: OAuthProvider.GOOGLE,
          url: oauthUrl,
        },
      });
    } catch (error) {
      return handleServiceError('Failed to generate Google OAuth URL', error);
    }
  }

  async handleGoogleCallback(callbackDto: OAuthCallbackDto, request: any): Promise<any> {
    try {
      // Validate callback data
      const validatedData = await this.authValidator.validateOAuthCallback(callbackDto);

      // Create Google OAuth client
      const googleClient = new OAuth2Client(
        config.oauth.google.clientId,
        config.oauth.google.clientSecret,
        config.oauth.redirectUri
      );

      // Exchange code for Google token
      const { tokens } = await googleClient.getToken({
        code: validatedData.code!,
        redirect_uri: config.oauth.redirectUri,
      });

      if (!tokens.access_token) {
        throw new Error('Failed to exchange code for Google token');
      }

      // Verify Google OAuth token and get user info
      const oauthUserInfo = await verifyGoogleToken(tokens.access_token);

      // Find or create user
      const oauthAccount = await this.oauthAccountRepository.findByProviderAndUserId(OAuthProvider.GOOGLE, oauthUserInfo.id);
      let user = oauthAccount?.User || null;

      if (!user) {
        // Check if user exists by email
        user = await this.userRepository.findByEmail(oauthUserInfo.email);

        if (user) {
          // Link existing user to OAuth provider
          await this.oauthAccountRepository.create(user.id, OAuthProvider.GOOGLE, oauthUserInfo.id, tokens.access_token);
        } else {
          // Create new user with personal team
          const teamData = await import('../../utils/team.util').then(m => m.generateUniqueTeamSlug(oauthUserInfo.email));

          user = await this.userRepository.createOAuthUserAndPersonalTeam({
            email: oauthUserInfo.email,
            firstName: oauthUserInfo.firstName,
            lastName: oauthUserInfo.lastName,
            emailVerifiedAt: new Date(), // OAuth users are pre-verified
            status: 'ACTIVE',
            teamName: teamData.name,
            teamSlug: teamData.slug,
          });

          // Link OAuth account
          await this.oauthAccountRepository.create(user.id, OAuthProvider.GOOGLE, oauthUserInfo.id, tokens.access_token);
        }
      } else {
        // Update OAuth access token
        await this.oauthAccountRepository.update(oauthAccount.id, {
          accessToken: tokens.access_token
        });
      }

      // Check if user has MFA enabled
      if (user.totpEnabled) {
        // Generate session token for MFA verification
        const sessionToken = generateSessionToken();

        // Store MFA verification session temporarily
        await prisma.mfaVerificationSession.create({
          data: {
            userId: user.id,
            email: user.email,
            mfaMethod: MfaMethod.TOTP,
            sessionToken: sessionToken,
            expiresAt: moment().add(10, 'minutes').toDate(),
            status: MfaVerificationSessionStatus.pending,
          },
        });

        return generateSuccessResponse({
          statusCode: HttpStatus.OK,
          message: Constants.requiresTwoFactor,
          data: {
            requiresTwoFactor: true,
            sessionToken,
          },
        });
      }

      // Generate tokens
      const jwtTokens = await generateTokens(user, this.jwtService);
      const { accessToken, refreshToken } = jwtTokens;

      // Create session
      await this.sessionRepository.createSession({
        userId: user.id,
        token: refreshToken,
        expiresAt: moment().add(7, 'days').toDate(),
        userAgent: request.headers['user-agent'] || 'unknown',
        ipAddress: request.ip || 'unknown',
      });

      // Get user's personal team
      const personalTeam = await this.teamRepository.findUserPersonalTeam(user.id);
      if (!personalTeam) {
        throw new Error('Personal team not found for user');
      }

      const response: OAuthLoginResponseDto = {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name || undefined,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          photoUrl: user.photoUrl || undefined,
          isEmailVerified: user.isEmailVerified ?? !!user.emailVerifiedAt,
          status: user.status,
        },
        defaultTeam: {
          id: personalTeam.id,
          reference: personalTeam.reference,
          name: personalTeam.name,
          slug: personalTeam.slug,
        },
      };

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.successMessage,
        data: response,
      });
    } catch (error) {
      return handleServiceError('Google OAuth callback failed', error);
    }
  }

  async getGitHubOAuthUrl(): Promise<any> {
    try {
      // Generate GitHub OAuth URL
      const githubOAuthUrl = new URL(config.oauth.github.authUrl!);
      githubOAuthUrl.searchParams.set('client_id', config.oauth.github.clientId!);
      githubOAuthUrl.searchParams.set('redirect_uri', config.oauth.redirectUri!);
      githubOAuthUrl.searchParams.set('scope', 'read:user user:email');
      githubOAuthUrl.searchParams.set('state', randomBytes(32).toString('hex'));

      return generateSuccessResponse({
        statusCode: 200,
        message: Constants.successMessage,
        data: {
          provider: OAuthProvider.GITHUB,
          url: githubOAuthUrl.toString(),
        },
      });
    } catch (error) {
      return handleServiceError('Failed to generate GitHub OAuth URL', error);
    }
  }

  async handleGitHubCallback(callbackDto: OAuthCallbackDto, request: any): Promise<any> {
    try {
      // Validate callback data
      const validatedData = await this.authValidator.validateOAuthCallback(callbackDto);

      // Exchange code for GitHub token
      const tokenResponse = await fetch(config.oauth.github.tokenUrl!, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: config.oauth.github.clientId,
          client_secret: config.oauth.github.clientSecret,
          code: validatedData.code,
          redirect_uri: config.oauth.redirectUri,
        }),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenData.access_token) {
        throw new Error('Failed to exchange code for GitHub token');
      }

      // Verify GitHub OAuth token and get user info
      const oauthUserInfo = await verifyGitHubToken(tokenData.access_token);

      // Find or create user
      const githubAccount = await this.oauthAccountRepository.findByProviderAndUserId(OAuthProvider.GITHUB, oauthUserInfo.id);
      let user = githubAccount?.User || null;

      if (!user) {
        // Check if user exists by email
        user = await this.userRepository.findByEmail(oauthUserInfo.email);

        if (user) {
          // Link existing user to OAuth provider
          await this.oauthAccountRepository.create(user.id, OAuthProvider.GITHUB, oauthUserInfo.id, tokenData.access_token);
        } else {
          // Create new user with personal team
          const teamData = await import('../../utils/team.util').then(m => m.generateUniqueTeamSlug(oauthUserInfo.email));

          user = await this.userRepository.createOAuthUserAndPersonalTeam({
            email: oauthUserInfo.email,
            firstName: oauthUserInfo.firstName,
            lastName: oauthUserInfo.lastName,
            emailVerifiedAt: new Date(), // OAuth users are pre-verified
            status: UserStatus.active,
            teamName: teamData.name,
            teamSlug: teamData.slug,
          });

          // Link OAuth account
          await this.oauthAccountRepository.create(user.id, OAuthProvider.GITHUB, oauthUserInfo.id, tokenData.access_token);

        }
      } else {
        // Update OAuth access token
        await this.oauthAccountRepository.update(githubAccount.id, {
          accessToken: tokenData.access_token
        });
      }

      // Check if user has MFA enabled
      if (user.totpEnabled) {
        // Generate session token for MFA verification
        const sessionToken = generateSessionToken();

        // Store MFA verification session temporarily
        await prisma.mfaVerificationSession.create({
          data: {
            userId: user.id,
            email: user.email,
            mfaMethod: MfaMethod.TOTP,
            sessionToken: sessionToken,
            expiresAt: moment().add(10, 'minutes').toDate(),
            status: MfaVerificationSessionStatus.pending,
          },
        });

        return generateSuccessResponse({
          statusCode: HttpStatus.OK,
          message: Constants.requiresTwoFactor,
          data: {
            requiresTwoFactor: true,
            sessionToken,
          },
        });
      }

      // Generate tokens
      const jwtTokens = await generateTokens(user, this.jwtService);
      const { accessToken, refreshToken } = jwtTokens;

      // Create session
      await this.sessionRepository.createSession({
        userId: user.id,
        token: refreshToken,
        expiresAt: moment().add(7, 'days').toDate(),
        userAgent: request.headers['user-agent'] || 'unknown',
        ipAddress: request.ip || 'unknown',
      });

      // Get user's personal team
      const personalTeam = await this.teamRepository.findUserPersonalTeam(user.id);
      if (!personalTeam) {
        throw new Error('Personal team not found for user');
      }

      const response: OAuthLoginResponseDto = {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name || undefined,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          photoUrl: user.photoUrl || undefined,
          isEmailVerified: user.isEmailVerified ?? !!user.emailVerifiedAt,
          status: user.status,
        },
        defaultTeam: {
          id: personalTeam.id,
          reference: personalTeam.reference,
          name: personalTeam.name,
          slug: personalTeam.slug,
        },
      };

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.successMessage,
        data: response,
      });
    } catch (error) {
      return handleServiceError('GitHub OAuth callback failed', error);
    }
  }

  async logout(logoutDto: LogoutDto): Promise<any> {
    try {
      // Validate logout data and session
      const { validatedData } = await this.authValidator.validateLogout(logoutDto);

      // Revoke the refresh token
      await this.sessionRepository.deleteSessionByRefreshToken(validatedData.refreshToken);

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.successMessage,
      });
    } catch (error) {
      return handleServiceError('Logout failed', error);
    }
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto, request: any): Promise<any> {
    try {
      // Validate refresh token data
      const { user } = await this.authValidator.validateRefreshToken(refreshTokenDto);

      // Revoke the old refresh token
      await this.sessionRepository.deleteSessionByRefreshToken(refreshTokenDto.refreshToken);

      // Generate new tokens
      const tokens = await generateTokens(user, this.jwtService);
      const { accessToken, refreshToken } = tokens;

      // Create new session with new refresh token
      await this.sessionRepository.createSession({
        userId: user.id,
        token: refreshToken,
        expiresAt: moment().add(7, 'days').toDate(),
        userAgent: request.headers['user-agent'] || 'unknown',
        ipAddress: request.ip || 'unknown',
      });

      return generateSuccessResponse({
        statusCode: 200,
        message: Constants.successMessage,
        data: {
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      return handleServiceError('Token refresh failed', error);
    }
  }

  async logoutAllDevices(userId: number, request: any): Promise<any> {
    try {
      // Revoke all user sessions
      await this.sessionRepository.deleteAllUserSessionsByuserId(userId);

      return generateSuccessResponse({
        statusCode: 200,
        message: Constants.successMessage
      });
    } catch (error) {
      return handleServiceError('Logout from all devices failed', error);
    }
  }

  async requestPasswordReset(resetPasswordRequestDto: ResetPasswordRequestDto, request: any): Promise<any> {
    try {
      // Validate reset password request data
      const { user } = await this.authValidator.validateResetPasswordRequest(resetPasswordRequestDto);

      // Always return success to prevent email enumeration
      // If user exists, send reset email; if not, still return success
      if (user) {
        // Invalidate any existing password reset tokens for this user
        await this.verificationRequestRepository.deleteByUserIdAndType(
          user.id,
          VerificationRequestType.PASSWORD_RESET
        );

        // Generate reset token
        const resetToken = uuidv4();

        // Store reset token with expiration (1 hour)
        await this.verificationRequestRepository.create(
          user.id,
          user.email,
          resetToken,
          VerificationRequestType.PASSWORD_RESET,
          moment().add(1, 'hour').toDate()
        );

        // TODO: Send password reset email with resetToken
        // This would typically use a queue system to send emails
        console.log(`Password reset token for ${user.email}: ${resetToken}`);
      }

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.passwordResetMessage,
      });
    } catch (error) {
      return handleServiceError('Password reset request failed', error);
    }
  }

  async confirmPasswordReset(resetPasswordConfirmDto: ResetPasswordConfirmDto, request: any): Promise<any> {
    try {
      // Validate reset password confirm data
      const { user, verificationRequest } = await this.authValidator.validateResetPasswordConfirm(resetPasswordConfirmDto);

      // Hash the new password
      const hashedPassword = await hashPassword(resetPasswordConfirmDto.newPassword);

      // Update user password in LocalAuthAccount
      if (user.localAuthAccount) {
        await prisma.localAuthAccount.update({
          where: { userId: user.id },
          data: { passwordHash: hashedPassword },
        });
      }

      // Invalidate the password reset token by deleting it
      await this.verificationRequestRepository.delete(verificationRequest.id);

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.passwordResetSuccessMessage,
      });
    } catch (error) {
      return handleServiceError('Password reset confirmation failed', error);
    }
  }

  async changePassword(changePasswordDto: ChangePasswordDto, userId: number, request: any): Promise<any> {
    try {
      // Validate change password data
      const { user } = await this.authValidator.validateChangePassword(changePasswordDto, userId);

      // Hash the new password
      const hashedPassword = await hashPassword(changePasswordDto.newPassword);

      // Update user password
      await this.localAuthAccountRepository.updatePassword(user.id, hashedPassword);

      return generateSuccessResponse({
        statusCode: 200,
        message: Constants.successMessage,
      });
    } catch (error) {
      return handleServiceError('Password change failed', error);
    }
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<any> {
    try {
      // Validate email verification data
      const { user, verificationRequest } = await this.authValidator.validateVerifyEmail(verifyEmailDto);

      // Update user email verification status
      await this.userRepository.update(user.id, {
        emailVerifiedAt: new Date(),
        status: UserStatus.active,
      });

      // Delete the verification token after successful verification
      await this.verificationRequestRepository.delete(verificationRequest.id);

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.successMessage,
        data: {
          email: user.email,
          isEmailVerified: true,
        },
      });
    } catch (error) {
      return handleServiceError('Email verification failed', error);
    }
  }

  async resendVerification(resendVerificationDto: ResendVerificationDto): Promise<any> {
    try {
      // Validate resend verification data
      const { user } = await this.authValidator.validateResendVerification(resendVerificationDto);

      // Delete any existing email verification tokens for this user
      await this.verificationRequestRepository.deleteByUserIdAndType(
        user.id,
        VerificationRequestType.EMAIL_VERIFICATION
      );

      // Generate new verification token
      const verificationToken = generateSessionToken(); // Using the same token generator for now
      const verificationExpiresAt = moment().add(1, 'day').toDate();

      // Create new verification request
      await this.verificationRequestRepository.create(
        user.id,
        user.email,
        verificationToken,
        VerificationRequestType.EMAIL_VERIFICATION,
        verificationExpiresAt
      );

      // TODO: Send email verification email with verificationToken
      // This would typically use a queue system to send emails
      console.log(`Email verification token for ${user.email}: ${verificationToken}`);

      return generateSuccessResponse({
        statusCode: 200,
        message: Constants.successMessage,
        data: {
          email: user.email,
        },
      });
    } catch (error) {
      return handleServiceError('Resend verification failed', error);
    }
  }

  async setupMfa(userId: number): Promise<any> {
    try {
      // Validate user and check TOTP status
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if TOTP is already enabled
      if (user.totpEnabled) {
        throw new Error('TOTP is already enabled');
      }

      // Generate TOTP secret and QR code
      const { secret, qrCode } = await setupTotp(user.email);

      // Store the secret temporarily (not enabled yet)
      await this.userRepository.update(userId, {
        totpSecret: secret
      });

      // Build response object
      const response: TotpSetupResponseDto = {
        qrCode: qrCode,
        manualEntryKey: secret,
        issuer: config.mfa.issuer,
        accountName: user.email,
      };

      return generateSuccessResponse({
        statusCode: 200,
        message: Constants.successMessage,
        data: response,
      });
    } catch (error) {
      return handleServiceError('Error setting up TOTP', error);
    }
  }

  async verifyMfa(userId: number, mfaVerifyDto: MfaVerifyDto): Promise<any> {
    try {
      // Validate MFA verification data
      await this.authValidator.validateMfaVerify(userId, mfaVerifyDto);

      // Enable TOTP for the user
      await this.userRepository.update(userId, {
        totpEnabled: true,
      });

      // Generate and store backup codes
      const backupCodes = await generateBackupCodes();
      const hashedCodes = await Promise.all(backupCodes.map(code => hashBackupCode(code)));
      await this.backupCodeRepository.createBackupCodes(userId, hashedCodes);

      // Build response
      const response: TotpVerifySetupResponseDto = {
        backupCodes
      };

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.successMessage,
        data: response,
      });
    } catch (error) {
      return handleServiceError('Error verifying TOTP setup', error);
    }
  }

  async challengeMfa(mfaChallengeDto: MfaChallengeDto, request: any): Promise<any> {
    try {
      // Validate MFA challenge data
      const { user, session } = await this.authValidator.validateMfaChallenge(mfaChallengeDto);

      // Mark MFA verification session as verified
      await prisma.mfaVerificationSession.update({
        where: { id: session.id },
        data: { status: 'verified' },
      });

      // Generate tokens
      const tokens = await generateTokens(user, this.jwtService);
      const { accessToken, refreshToken } = tokens;

      // Create session
      await this.sessionRepository.createSession({
        userId: user.id,
        token: refreshToken,
        expiresAt: moment().add(7, 'days').toDate(),
        userAgent: request.headers['user-agent'] || 'unknown',
        ipAddress: request.ip || 'unknown',
      });

      // Note: Login time is tracked via session creation above


      // Get user's personal team
      const personalTeam = await this.teamRepository.findUserPersonalTeam(user.id);
      if (!personalTeam) {
        throw new Error('Personal team not found for user');
      }

      const response: LoginResponseDto = {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          photoUrl: user.photoUrl,
          isEmailVerified: user.isEmailVerified ?? !!user.emailVerifiedAt,
          status: user.status,
        },
        defaultTeam: {
          id: personalTeam.id,
          reference: personalTeam.reference,
          name: personalTeam.name,
          slug: personalTeam.slug,
        },
      };

      return generateSuccessResponse({
        statusCode: 200,
        message: '2FA verification successful',
        data: response,
      });
    } catch (error) {
      return handleServiceError('Error verifying 2FA', error);
    }
  }

  async getBackupCodes(userId: number): Promise<any> {
    try {
      // Validate user access
      await this.authValidator.validateGetBackupCodes(userId);

      // Get and filter backup codes
      const backupCodes = await this.backupCodeRepository.findByUserId(userId);
      const unusedCodes = backupCodes.filter(code => !code.used);

      // Build response
      const response: BackupCodesResponseDto = {
        remainingCount: unusedCodes.length,
        codes: unusedCodes.map(code => maskBackupCode(code.code)),
      };

      return generateSuccessResponse({
        statusCode: 200,
        message: Constants.retrievedSuccessfully,
        data: response,
      });
    } catch (error) {
      return handleServiceError('Error retrieving backup codes', error);
    }
  }

  async consumeBackupCode(mfaBackupCodeConsumeDto: MfaBackupCodeConsumeDto, request: any): Promise<any> {
    try {
      // Validate backup code consumption data
      const { user, matchingCode } = await this.authValidator.validateMfaBackupCodeConsume(mfaBackupCodeConsumeDto);

      // Mark backup code as used
      await this.backupCodeRepository.markAsUsed(matchingCode.id);

      // Generate tokens
      const tokens = await generateTokens(user, this.jwtService);
      const { accessToken, refreshToken } = tokens;

      // Create session
      await this.sessionRepository.createSession({
        userId: user.id,
        token: refreshToken,
        expiresAt: moment().add(7, 'days').toDate(),
        userAgent: request.headers['user-agent'] || 'unknown',
        ipAddress: request.ip || 'unknown',
      });

      // Get user's personal team
      const personalTeam = await this.teamRepository.findUserPersonalTeam(user.id);
      if (!personalTeam) {
        throw new Error('Personal team not found for user');
      }

      const response: LoginResponseDto = {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          photoUrl: user.photoUrl,
          isEmailVerified: user.isEmailVerified ?? !!user.emailVerifiedAt,
          status: user.status,
        },
        defaultTeam: {
          id: personalTeam.id,
          reference: personalTeam.reference,
          name: personalTeam.name,
          slug: personalTeam.slug,
        },
      };

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'Backup code verification successful',
        data: response,
      });
    } catch (error) {
      return handleServiceError('Error consuming backup code', error);
    }
  }

  async disableMfa(userId: number, mfaDisableDto: MfaDisableDto, request: any): Promise<any> {
    try {
      // Validate MFA disable data
      await this.authValidator.validateMfaDisable(userId, mfaDisableDto);

      // Disable TOTP for the user
      await this.userRepository.update(userId, {
        totpSecret: null,
        totpEnabled: false,
      });

      // Clean up backup codes
      await this.backupCodeRepository.deleteByUserId(userId);

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.successMessage,
      });
    } catch (error) {
      return handleServiceError('Error disabling MFA', error);
    }
  }

  async regenerateBackupCodes(userId: number, mfaRegenerateBackupCodesDto: MfaRegenerateBackupCodesDto, request: any): Promise<any> {
    try {
      // Validate MFA regeneration data
      await this.authValidator.validateMfaRegenerateBackupCodes(userId, mfaRegenerateBackupCodesDto);

      // Remove existing backup codes
      await this.backupCodeRepository.deleteByUserId(userId);

      // Generate and store new backup codes
      const backupCodes = await generateBackupCodes();
      const hashedCodes = await Promise.all(backupCodes.map(code => hashBackupCode(code)));
      await this.backupCodeRepository.createBackupCodes(userId, hashedCodes);

      // Build response
      const response: RegenerateBackupCodesResponseDto = {
        backupCodes
      };

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.successMessage,
        data: response,
      });
    } catch (error) {
      return handleServiceError('Error regenerating backup codes', error);
    }
  }
}
