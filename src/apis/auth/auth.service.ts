import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from '../../repositories/user.repository';
import { SessionRepository } from '../../repositories/session.repository';
import { LoginActivityRepository } from '../../repositories/login-activity.repository';
import { BackupCodeRepository } from '../../repositories/backup-code.repository';
import { MfaRepository } from '../../repositories/mfa.repository';
import { AuthValidator } from './auth.validator';
import { generateSuccessResponse } from '../../utils/util';
import { handleServiceError } from '../../utils/error.util';
import { generateTokens, hashPassword } from '../../utils/authentication.util';
import { generateSessionToken, setupTotp, generateBackupCodes, hashBackupCode, maskBackupCode } from '../../helpers/mfa.helper';
import { randomBytes } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { config } from '../../config/config';
import * as moment from 'moment';
import { verifyGoogleToken, verifyGitHubToken } from '../../helpers/oauth.helper';
import { OAuthProvider } from '../../common/enums/generic.enum';
import { LoginDto, LoginResponseDto, OAuthCallbackDto, OAuthLoginResponseDto, LogoutDto, RefreshTokenDto, ResetPasswordRequestDto, ResetPasswordConfirmDto, ChangePasswordDto, RegisterDto, VerifyEmailDto, ResendVerificationDto, MfaVerifyDto, MfaChallengeDto, MfaBackupCodeConsumeDto, MfaDisableDto, MfaRegenerateBackupCodesDto, TotpSetupResponseDto, TotpVerifySetupResponseDto, BackupCodesResponseDto, RegenerateBackupCodesResponseDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly loginActivityRepository: LoginActivityRepository,
    private readonly backupCodeRepository: BackupCodeRepository,
    private readonly mfaRepository: MfaRepository,
    private readonly authValidator: AuthValidator,
    private readonly jwtService: JwtService,
  ) { }

  async login(loginDto: LoginDto, request: any): Promise<any> {
    try {
      // Validate login data
      const { user } = await this.authValidator.validateLogin(loginDto);

      // Check if user has 2FA enabled (simplified for now)
      // TODO: Implement proper MFA check when MFA repository methods are available
      const hasMfaEnabled = false; // Placeholder
      if (hasMfaEnabled) {
        // Generate session token for 2FA verification
        const sessionToken = generateSessionToken();

        // Store session token temporarily
        await this.sessionRepository.createRefreshToken({
          userId: user.id,
          token: sessionToken,
          expiresAt: moment().add(10, 'minutes').toDate(),
          isRevoked: false,
        });

        return generateSuccessResponse({
          statusCode: 200,
          message: 'Two-factor authentication required',
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
      await this.sessionRepository.createRefreshToken({
        userId: user.id,
        token: refreshToken,
        expiresAt: moment().add(7, 'days').toDate(),
        isRevoked: false,
      });

      // Update user login time
      await this.userRepository.updateUser({
        ...user,
        lastLoginAt: moment().toDate(),
      });

      // Log login activity
      await this.loginActivityRepository.create({
        userId: user.id,
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers['user-agent'] || 'unknown',
        success: true,
      });

      const response: LoginResponseDto = {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          isEmailVerified: user.isEmailVerified,
          status: user.status,
        },
      };

      return generateSuccessResponse({
        statusCode: 200,
        message: 'Login successful',
        data: response,
      });
    } catch (error) {
      return handleServiceError(error, 'Login failed');
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
        message: 'Google OAuth URL generated successfully',
        data: {
          provider: OAuthProvider.google,
          url: oauthUrl,
        },
      });
    } catch (error) {
      return handleServiceError(error, 'Failed to generate Google OAuth URL');
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
      let user = await this.userRepository.findUserByOAuthId(OAuthProvider.google, oauthUserInfo.id);
      let isNewUser = false;

      if (!user) {
        // Check if user exists by email
        user = await this.userRepository.findByEmail(oauthUserInfo.email);

        if (user) {
          // Link existing user to OAuth provider
          await this.userRepository.linkOAuthAccount(user.id, OAuthProvider.google, oauthUserInfo.id, tokens.access_token);
        } else {
          // Create new user
          user = await this.userRepository.createOAuthUser({
            email: oauthUserInfo.email,
            firstName: oauthUserInfo.firstName,
            lastName: oauthUserInfo.lastName,
            isEmailVerified: true, // OAuth users are pre-verified
            oauthProvider: OAuthProvider.google,
            oauthId: oauthUserInfo.id,
          });
          isNewUser = true;
        }
      } else {
        // Update OAuth access token
        await this.userRepository.updateOAuthAccessToken(user.id, OAuthProvider.google, tokens.access_token);
      }

      // Generate tokens
      const jwtTokens = await generateTokens(user, this.jwtService);
      const { accessToken, refreshToken } = jwtTokens;

      // Create session
      await this.sessionRepository.createRefreshToken({
        userId: user.id,
        token: refreshToken,
        expiresAt: moment().add(7, 'days').toDate(),
        isRevoked: false,
      });

      // Update user login time
      await this.userRepository.updateUser({
        ...user,
        lastLoginAt: moment().toDate(),
      });

      // Log login activity
      await this.loginActivityRepository.create({
        userId: user.id,
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers['user-agent'] || 'unknown',
        success: true,
      });

      const response: OAuthLoginResponseDto = {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          isEmailVerified: user.isEmailVerified,
          status: user.status,
        },
        isNewUser,
      };

      return generateSuccessResponse({
        statusCode: 200,
        message: isNewUser ? 'Account created and login successful' : 'Login successful',
        data: response,
      });
    } catch (error) {
      return handleServiceError(error, 'Google OAuth callback failed');
    }
  }

  async getGitHubOAuthUrl(): Promise<any> {
    try {
      // Generate GitHub OAuth URL
      const githubOAuthUrl = new URL(config.oauth.github.authUrl!);
      githubOAuthUrl.searchParams.set('client_id', config.oauth.github.clientId!);
      githubOAuthUrl.searchParams.set('redirect_uri', config.oauth.redirectUri!);
      githubOAuthUrl.searchParams.set('scope', 'user:email');
      githubOAuthUrl.searchParams.set('state', randomBytes(32).toString('hex'));

      return generateSuccessResponse({
        statusCode: 200,
        message: 'GitHub OAuth URL generated successfully',
        data: {
          provider: OAuthProvider.github,
          url: githubOAuthUrl.toString(),
        },
      });
    } catch (error) {
      return handleServiceError(error, 'Failed to generate GitHub OAuth URL');
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
      let user = await this.userRepository.findUserByOAuthId(OAuthProvider.github, oauthUserInfo.id);
      let isNewUser = false;

      if (!user) {
        // Check if user exists by email
        user = await this.userRepository.findByEmail(oauthUserInfo.email);

        if (user) {
          // Link existing user to OAuth provider
          await this.userRepository.linkOAuthAccount(user.id, OAuthProvider.github, oauthUserInfo.id, tokenData.access_token);
        } else {
          // Create new user
          user = await this.userRepository.createOAuthUser({
            email: oauthUserInfo.email,
            firstName: oauthUserInfo.firstName,
            lastName: oauthUserInfo.lastName,
            isEmailVerified: true, // OAuth users are pre-verified
            oauthProvider: OAuthProvider.github,
            oauthId: oauthUserInfo.id,
          });
          isNewUser = true;
        }
      } else {
        // Update OAuth access token
        await this.userRepository.updateOAuthAccessToken(user.id, OAuthProvider.github, tokenData.access_token);
      }

      // Generate tokens
      const jwtTokens = await generateTokens(user, this.jwtService);
      const { accessToken, refreshToken } = jwtTokens;

      // Create session
      await this.sessionRepository.createRefreshToken({
        userId: user.id,
        token: refreshToken,
        expiresAt: moment().add(7, 'days').toDate(),
        isRevoked: false,
      });

      // Update user login time
      await this.userRepository.updateUser({
        ...user,
        lastLoginAt: moment().toDate(),
      });

      // Log login activity
      await this.loginActivityRepository.create({
        userId: user.id,
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers['user-agent'] || 'unknown',
        success: true,
      });

      const response: OAuthLoginResponseDto = {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          isEmailVerified: user.isEmailVerified,
          status: user.status,
        },
        isNewUser,
      };

      return generateSuccessResponse({
        statusCode: 200,
        message: isNewUser ? 'Account created and login successful' : 'Login successful',
        data: response,
      });
    } catch (error) {
      return handleServiceError(error, 'GitHub OAuth callback failed');
    }
  }

  async logout(logoutDto: LogoutDto, request: any): Promise<any> {
    try {
      // Validate logout data
      const validatedData = await this.authValidator.validateLogout(logoutDto);

      // Find the session by refresh token
      const session = await this.sessionRepository.findRefreshToken(validatedData.refreshToken);

      if (!session) {
        throw new Error('Invalid refresh token');
      }

      // Revoke the refresh token
      await this.sessionRepository.revokeRefreshToken(validatedData.refreshToken);

      // Log logout activity
      await this.loginActivityRepository.create({
        userId: session.userId,
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers['user-agent'] || 'unknown',
        success: true,
      });

      return generateSuccessResponse({
        statusCode: 200,
        message: 'Logout successful',
        data: {},
      });
    } catch (error) {
      return handleServiceError(error, 'Logout failed');
    }
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto, request: any): Promise<any> {
    try {
      // Validate refresh token data
      const { user } = await this.authValidator.validateRefreshToken(refreshTokenDto);

      // Revoke the old refresh token
      await this.sessionRepository.revokeRefreshToken(refreshTokenDto.refreshToken);

      // Generate new tokens
      const tokens = await generateTokens(user, this.jwtService);
      const { accessToken, refreshToken } = tokens;

      // Create new session with new refresh token
      await this.sessionRepository.createRefreshToken({
        userId: user.id,
        token: refreshToken,
        expiresAt: moment().add(7, 'days').toDate(),
        isRevoked: false,
      });

      // Log refresh activity
      await this.loginActivityRepository.create({
        userId: user.id,
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers['user-agent'] || 'unknown',
        success: true,
      });

      return generateSuccessResponse({
        statusCode: 200,
        message: 'Token refreshed successfully',
        data: {
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      return handleServiceError(error, 'Token refresh failed');
    }
  }

  async logoutAllDevices(userId: number, request: any): Promise<any> {
    try {
      // Revoke all user sessions
      await this.sessionRepository.revokeAllSessions(userId);

      return generateSuccessResponse({
        statusCode: 200,
        message: 'Logged out from all devices successfully'
      });
    } catch (error) {
      return handleServiceError(error, 'Logout from all devices failed');
    }
  }

  async requestPasswordReset(resetPasswordRequestDto: ResetPasswordRequestDto, request: any): Promise<any> {
    try {
      // Validate reset password request data
      const { user } = await this.authValidator.validateResetPasswordRequest(resetPasswordRequestDto);

      // Always return success to prevent email enumeration
      // If user exists, send reset email; if not, still return success
      if (user) {
        // Generate reset token
        const resetToken = generateSessionToken(); // Using the same token generator for now

        // Store reset token with expiration (e.g., 1 hour)
        await this.sessionRepository.createRefreshToken({
          userId: user.id,
          token: resetToken,
          expiresAt: moment().add(1, 'hour').toDate(),
          isRevoked: false,
        });

        // TODO: Send password reset email with resetToken
        // This would typically use a queue system to send emails
        console.log(`Password reset token for ${user.email}: ${resetToken}`);
      }

      return generateSuccessResponse({
        statusCode: 200,
        message: 'If an account with that email exists, a password reset link has been sent',
        data: {},
      });
    } catch (error) {
      return handleServiceError(error, 'Password reset request failed');
    }
  }

  async confirmPasswordReset(resetPasswordConfirmDto: ResetPasswordConfirmDto, request: any): Promise<any> {
    try {
      // Validate reset password confirm data
      const { user } = await this.authValidator.validateResetPasswordConfirm(resetPasswordConfirmDto);

      // Hash the new password
      const hashedPassword = await hashPassword(resetPasswordConfirmDto.newPassword);

      // Update user password
      await this.userRepository.updateUser({
        ...user,
        password: hashedPassword,
      });

      // Revoke the reset token
      await this.sessionRepository.revokeRefreshToken(resetPasswordConfirmDto.token);

      // Revoke all user sessions to force re-login
      await this.sessionRepository.revokeAllSessions(user.id);

      // Log password reset activity
      await this.loginActivityRepository.create({
        userId: user.id,
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers['user-agent'] || 'unknown',
        success: true,
      });

      return generateSuccessResponse({
        statusCode: 200,
        message: 'Password reset successfully. Please log in with your new password.',
        data: {},
      });
    } catch (error) {
      return handleServiceError(error, 'Password reset confirmation failed');
    }
  }

  async changePassword(changePasswordDto: ChangePasswordDto, userId: number, request: any): Promise<any> {
    try {
      // Validate change password data
      const { user } = await this.authValidator.validateChangePassword(changePasswordDto, userId);

      // Hash the new password
      const hashedPassword = await hashPassword(changePasswordDto.newPassword);

      // Update user password
      await this.userRepository.updateUser({
        ...user,
        password: hashedPassword,
      });

      // Log password change activity
      await this.loginActivityRepository.create({
        userId: user.id,
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers['user-agent'] || 'unknown',
        success: true,
      });

      return generateSuccessResponse({
        statusCode: 200,
        message: 'Password changed successfully',
        data: {},
      });
    } catch (error) {
      return handleServiceError(error, 'Password change failed');
    }
  }

  async register(registerDto: RegisterDto, request: any): Promise<any> {
    try {
      // Validate registration data
      const validatedData = await this.authValidator.validateRegister(registerDto);

      // Hash the password
      const hashedPassword = await hashPassword(validatedData.password);

      // Create new user
      const user = await this.userRepository.create({
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
        isEmailVerified: false, // Email verification required
        status: 'ACTIVE',
      });

      // TODO: Send email verification email
      console.log(`Email verification needed for ${user.email}`);

      return generateSuccessResponse({
        statusCode: 201,
        message: 'Account registered successfully. Please check your email to verify your email.',
        data: {
          email: user.email,
          verificationRequired: true,
        },
      });
    } catch (error) {
      return handleServiceError(error, 'Registration failed');
    }
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<any> {
    try {
      // Validate email verification data
      const { user } = await this.authValidator.validateVerifyEmail(verifyEmailDto);

      // Update user email verification status
      await this.userRepository.updateUser({
        ...user,
        isEmailVerified: true,
      });

      return generateSuccessResponse({
        statusCode: 200,
        message: 'Email verified successfully',
        data: {
          email: user.email,
          isEmailVerified: true,
        },
      });
    } catch (error) {
      return handleServiceError(error, 'Email verification failed');
    }
  }

  async resendVerification(resendVerificationDto: ResendVerificationDto): Promise<any> {
    try {
      // Validate resend verification data
      const { user } = await this.authValidator.validateResendVerification(resendVerificationDto);

      // Generate new verification token
      const verificationToken = generateSessionToken(); // Using the same token generator for now
      const verificationExpiresAt = moment().add(1, 'day').toDate();

      // Update user with new verification token
      await this.userRepository.updateUser({
        ...user,
        emailVerificationToken: verificationToken,
        emailVerificationExpiresAt: verificationExpiresAt,
      });

      // TODO: Send email verification email with verificationToken
      // This would typically use a queue system to send emails
      console.log(`Email verification token for ${user.email}: ${verificationToken}`);

      return generateSuccessResponse({
        statusCode: 200,
        message: 'Verification email sent successfully',
        data: {
          email: user.email,
        },
      });
    } catch (error) {
      return handleServiceError(error, 'Resend verification failed');
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
        qr_code: qrCode,
        manual_entry_key: secret,
        issuer: 'YourApp',
        account_name: user.email,
      };

      return generateSuccessResponse({
        statusCode: 200,
        message: 'TOTP setup initiated successfully',
        data: response,
      });
    } catch (error) {
      return handleServiceError(error, 'Error setting up TOTP');
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

      // Log successful TOTP setup
      await this.loginActivityRepository.createTwoFactorActivity({
        userId,
        ipAddress: 'unknown', // Could be passed from request context
        userAgent: 'unknown', // Could be passed from request context
        success: true,
        activityType: '2FA_TOTP_SETUP',
      });

      // Build response
      const response: TotpVerifySetupResponseDto = {
        backup_codes: backupCodes.map(code => maskBackupCode(code)),
      };

      return generateSuccessResponse({
        statusCode: 200,
        message: 'TOTP setup completed successfully',
        data: response,
      });
    } catch (error) {
      return handleServiceError(error, 'Error verifying TOTP setup');
    }
  }

  async challengeMfa(mfaChallengeDto: MfaChallengeDto, request: any): Promise<any> {
    try {
      // Validate MFA challenge data
      const { session, user } = await this.authValidator.validateMfaChallenge(mfaChallengeDto);

      // Generate tokens
      const tokens = await generateTokens(user, this.jwtService);
      const { accessToken, refreshToken } = tokens;

      // Create session
      await this.sessionRepository.createRefreshToken({
        userId: user.id,
        token: refreshToken,
        expiresAt: moment().add(7, 'days').toDate(),
        isRevoked: false,
      });

      // Update user login time
      await this.userRepository.updateUser({
        ...user,
        lastLoginAt: moment().toDate(),
      });

      // Log successful 2FA verification
      await this.loginActivityRepository.create({
        userId: session.userId,
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers['user-agent'] || 'unknown',
        success: true,
      });

      // Clean up MFA session
      await this.mfaRepository.cleanupExpiredMfaSessions();

      const response: LoginResponseDto = {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          isEmailVerified: user.isEmailVerified,
          status: user.status,
        },
      };

      return generateSuccessResponse({
        statusCode: 200,
        message: '2FA verification successful',
        data: response,
      });
    } catch (error) {
      return handleServiceError(error, 'Error verifying 2FA');
    }
  }

  async getBackupCodes(userId: number): Promise<any> {
    try {
      // Validate user access
      await this.authValidator.validateGetBackupCodes(userId);

      // Get and filter backup codes
      const backupCodes = await this.backupCodeRepository.findByUserId(userId);
      const unusedCodes = backupCodes.filter(code => !code.isUsed);

      // Build response
      const response: BackupCodesResponseDto = {
        remaining_count: unusedCodes.length,
        codes: unusedCodes.map(code => maskBackupCode(code.code)),
      };

      return generateSuccessResponse({
        statusCode: 200,
        message: 'Backup codes retrieved successfully',
        data: response,
      });
    } catch (error) {
      return handleServiceError(error, 'Error retrieving backup codes');
    }
  }

  async consumeBackupCode(mfaBackupCodeConsumeDto: MfaBackupCodeConsumeDto, request: any): Promise<any> {
    try {
      // Validate backup code consumption data
      const { session, user, matchingCode } = await this.authValidator.validateMfaBackupCodeConsume(mfaBackupCodeConsumeDto);

      // Mark backup code as used
      await this.backupCodeRepository.markAsUsed(matchingCode.id);

      // Generate tokens
      const tokens = await generateTokens(user, this.jwtService);
      const { accessToken, refreshToken } = tokens;

      // Create session
      await this.sessionRepository.createRefreshToken({
        userId: user.id,
        token: refreshToken,
        expiresAt: moment().add(7, 'days').toDate(),
        isRevoked: false,
      });

      // Update user login time
      await this.userRepository.updateUser({
        ...user,
        lastLoginAt: moment().toDate(),
      });

      // Log successful 2FA verification with backup code
      await this.loginActivityRepository.create({
        userId: session.userId,
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers['user-agent'] || 'unknown',
        success: true,
      });

      // Clean up MFA session
      await this.mfaRepository.cleanupExpiredMfaSessions();

      const response: LoginResponseDto = {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          isEmailVerified: user.isEmailVerified,
          status: user.status,
        },
      };

      return generateSuccessResponse({
        statusCode: 200,
        message: 'Backup code verification successful',
        data: response,
      });
    } catch (error) {
      return handleServiceError(error, 'Error consuming backup code');
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

      // Log TOTP disable
      await this.loginActivityRepository.createTwoFactorActivity({
        userId,
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers['user-agent'] || 'unknown',
        success: true,
        activityType: '2FA_TOTP_DISABLE',
      });

      return generateSuccessResponse({
        statusCode: 200,
        message: 'MFA disabled successfully',
        data: {},
      });
    } catch (error) {
      return handleServiceError(error, 'Error disabling MFA');
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

      // Log backup codes regeneration
      await this.loginActivityRepository.createTwoFactorActivity({
        userId,
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers['user-agent'] || 'unknown',
        success: true,
        activityType: '2FA_BACKUP_CODES_REGENERATED',
      });

      // Build response
      const response: RegenerateBackupCodesResponseDto = {
        backup_codes: backupCodes.map(code => maskBackupCode(code)),
        message: 'Backup codes regenerated successfully',
      };

      return generateSuccessResponse({
        statusCode: 200,
        message: 'Backup codes regenerated successfully',
        data: response,
      });
    } catch (error) {
      return handleServiceError(error, 'Error regenerating backup codes');
    }
  }
}
