import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { JwtService } from '@nestjs/jwt';
import { UserStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { UserRepository } from '../../../repositories/user.repository';
import { SessionRepository } from '../../../repositories/session.repository';
import { MfaRepository } from '../../../repositories/mfa.repository';
import { LoginActivityRepository } from '../../../repositories/login-activity.repository';
import { BackupCodeRepository } from '../../../repositories/backup-code.repository';
import { CoreAuthValidator } from './core-auth.validator';
import { generateSuccessResponse, throwError } from '../../../utils/util';
import { handleServiceError } from '../../../utils/error.util';
import {
  hashPassword,
  generateTokens,
  updateUserLoginTime,
} from '../../../utils/authentication.util';
import {
  getOAuthLoginUrl,
  exchangeCodeForToken,
  verifyOAuthToken,
  findOrCreateOAuthUser,
} from '../../../helpers/oauth.helper';
import { generateSessionToken } from '../../../helpers/mfa.helper';
import {
  detectSuspiciousLogin,
  shouldTriggerSecurityAlert,
  generateSecurityAlertMessage,
} from '../../../helpers/security-alert.helper';
import { PROCESS_NOTIFICATION_QUEUE } from '../../../common/constants/queues.constant';
import {
  MILLISECONDS_IN_DAY,
  EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS,
} from '../../../common/constants/time.constant';
import {
  RegisterDto,
  LoginDto,
  OAuthLoginDto,
  RefreshTokenDto,
  VerifyEmailDto,
  ResendVerificationDto,
  OAuthCallbackDto,
} from './dto/core-auth.dto';

@Injectable()
export class CoreAuthService {
  constructor(
    private userRepository: UserRepository,
    private sessionRepository: SessionRepository,
    private mfaRepository: MfaRepository,
    private loginActivityRepository: LoginActivityRepository,
    private authValidator: CoreAuthValidator,
    private jwtService: JwtService,
    private backupCodeRepository: BackupCodeRepository,
    @InjectQueue(PROCESS_NOTIFICATION_QUEUE)
    private readonly notificationQueue: Queue,
  ) {}

  // USER REGISTRATION & EMAIL VERIFICATION

  async register(registerDto: RegisterDto): Promise<any> {
    try {
      // Validate registration data
      const validatedRegisterData = await this.authValidator.validateRegister(registerDto);

      // Prepare user data
      const hashedPassword = await hashPassword(validatedRegisterData.password);
      const emailVerificationToken = uuidv4();
      const emailVerificationExpiresAt = new Date(Date.now() + MILLISECONDS_IN_DAY); // 24 hours

      // Create user and default team in a single transaction
      const result = await this.userRepository.createWithDefaultTeam({
        userData: {
          email: validatedRegisterData.email,
          password: hashedPassword,
          firstName: validatedRegisterData.firstName,
          lastName: validatedRegisterData.lastName,
          emailVerificationToken,
          emailVerificationExpiresAt,
        },
        userEmail: validatedRegisterData.email,
      });

      const { user } = result;

      // Send notification
      await this.notificationQueue.add('user-created', { userId: user.id, email: user.email });

      return generateSuccessResponse({
        statusCode: HttpStatus.CREATED,
        message: 'Registration successful. Please check your email to verify your account.',
        data: {
          email: user.email,
          canResendVerification: true,
          verificationExpiresIn: `${EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS} hours`,
        },
      });
    } catch (error) {
      return handleServiceError('Error registering user', error);
    }
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<any> {
    try {
      // Validate verification data
      const { user } = await this.authValidator.validateVerifyEmail(verifyEmailDto);

      // Update user verification status
      await this.userRepository.update(user.id, {
        isEmailVerified: true,
        status: UserStatus.ACTIVE,
        emailVerificationToken: null,
        emailVerificationExpiresAt: null,
      });

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'Email verified successfully',
        data: { email: user.email },
      });
    } catch (error) {
      return handleServiceError('Error verifying email', error);
    }
  }

  async resendVerification(resendVerificationDto: ResendVerificationDto): Promise<any> {
    try {
      // Validate resend verification data
      const { user } = await this.authValidator.validateResendVerification(resendVerificationDto);

      // Generate new verification token
      const emailVerificationToken = uuidv4();
      const emailVerificationExpiresAt = new Date(Date.now() + MILLISECONDS_IN_DAY);

      // Update user with new token
      await this.userRepository.update(user.id, {
        emailVerificationToken,
        emailVerificationExpiresAt,
      });

      // Send notification
      await this.notificationQueue.add('email-verification', {
        userId: user.id,
        email: user.email,
      });

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'Verification email sent successfully',
        data: { email: user.email },
      });
    } catch (error) {
      return handleServiceError('Error resending verification email', error);
    }
  }

  // AUTHENTICATION & LOGIN
  async login(loginDto: LoginDto, req?: any): Promise<any> {
    try {
      // Validate login data and get user
      const { user } = await this.authValidator.validateLogin(loginDto);

      // Generate tokens
      const { accessToken, refreshToken } = await generateTokens(user, this.jwtService);

      // Create session
      await this.sessionRepository.createRefreshToken({
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        isRevoked: false,
      });

      // Update user login time
      await updateUserLoginTime(user, this.userRepository);

      // Log login activity
      const loginContext: any = {
        userId: user.id,
        email: user.email,
        ipAddress: req?.ip || 'unknown',
        userAgent: req?.headers?.['user-agent'] || 'unknown',
        location: req?.headers?.['x-forwarded-for'] || undefined,
        timestamp: new Date(),
      };

      await this.loginActivityRepository.create({
        userId: user.id,
        ipAddress: req?.ip || 'unknown',
        userAgent: req?.headers?.['user-agent'] || 'unknown',
        location: req?.headers?.['x-forwarded-for'] || null,
        success: true,
      });

      // Check for suspicious login
      const recentLogins = await this.loginActivityRepository.findRecentByUserId(user.id, 5);
      const loginContexts: any[] = recentLogins.map(login => ({
        userId: login.userId,
        email: user.email,
        ipAddress: login.ipAddress,
        userAgent: login.userAgent,
        location: login.location || undefined,
        timestamp: login.createdAt,
      }));
      const isSuspicious = detectSuspiciousLogin(loginContexts, loginContext);

      if (isSuspicious.isSuspicious) {
        // logWarningMessage(`Suspicious login detected for user ${user.id}`); // Removed logWarningMessage
      }

      // Check if security alert should be triggered
      const failedAttempts = await this.loginActivityRepository.countFailedAttemptsByUserId(
        user.id,
        1,
      );
      const shouldAlert = shouldTriggerSecurityAlert(isSuspicious, failedAttempts);

      if (shouldAlert) {
        const alertMessage = generateSecurityAlertMessage(
          isSuspicious,
          failedAttempts,
          loginContext,
        );
        await this.notificationQueue.add('security-alert', {
          userId: user.id,
          message: alertMessage,
          type: 'suspicious-login',
        });
      }

      // Check if user has 2FA enabled
      const hasTotp = user.totpEnabled;
      const backupCodes = await this.backupCodeRepository.findUnusedByUserId(user.id);
      const hasBackupCodes = backupCodes.length > 0;
      const hasTwoFactor = hasTotp || hasBackupCodes;

      if (hasTwoFactor) {
        // Create MFA session for 2FA verification
        const sessionToken = generateSessionToken();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await this.mfaRepository.createMfaSession({
          sessionToken,
          userId: user.id,
          email: user.email,
          mfaMethod: 'TOTP', // Default method, can be overridden
          isVerified: false, // Will be verified after 2FA completion
          expiresAt,
        });

        // Determine available MFA methods based on user's actual setup
        const availableMethods: string[] = [];

        if (hasTotp) {
          availableMethods.push('totp');
        }

        if (hasBackupCodes) {
          availableMethods.push('backup_code');
        }

        // Email OTP is always available as fallback
        availableMethods.push('email_otp');

        // Return 2FA response structure
        return generateSuccessResponse({
          statusCode: HttpStatus.OK,
          message: 'Success',
          data: {
            requiresTwoFactor: true,
            sessionToken,
            availableMethods,
          },
        });
      }

      // If no MFA required, return full login response
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'Login successful',
        data: {
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            isEmailVerified: user.isEmailVerified,
            status: user.status,
          },
        },
      });
    } catch (error) {
      return handleServiceError('Error during login', error);
    }
  }

  async oauthLogin(oauthLoginDto: OAuthLoginDto, req?: any): Promise<any> {
    try {
      // Validate OAuth login data
      const validatedData = await this.authValidator.validateOAuthLogin(oauthLoginDto);

      // Exchange code for token
      const tokenData = await exchangeCodeForToken(validatedData.provider, validatedData.code);

      if (!tokenData) {
        throwError(
          'Failed to exchange code for token',
          HttpStatus.BAD_REQUEST,
          'oauthTokenExchangeFailed',
        );
      }

      // Verify OAuth token and get user info
      const userInfo = await verifyOAuthToken(validatedData.provider, tokenData);

      if (!userInfo) {
        throwError(
          'Failed to verify OAuth token',
          HttpStatus.BAD_REQUEST,
          'oauthTokenVerificationFailed',
        );
      }

      // Find or create user
      const { user, isNewUser } = await findOrCreateOAuthUser(
        validatedData.provider,
        userInfo,
        tokenData,
        this.userRepository,
      );

      // Generate tokens
      const { accessToken, refreshToken } = await generateTokens(user, this.jwtService);

      // Create session
      await this.sessionRepository.createRefreshToken({
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        isRevoked: false,
      });

      // Update user login time
      await updateUserLoginTime(user, this.userRepository);

      // Log login activity
      await this.loginActivityRepository.create({
        userId: user.id,
        ipAddress: req?.ip || 'unknown',
        userAgent: req?.headers?.['user-agent'] || 'unknown',
        location: req?.headers?.['x-forwarded-for'] || null,
        success: true,
      });

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: isNewUser ? 'OAuth login successful. Welcome!' : 'OAuth login successful',
        data: {
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            isEmailVerified: user.isEmailVerified,
            status: user.status,
          },
          isNewUser,
        },
      });
    } catch (error) {
      return handleServiceError('Error during OAuth login', error);
    }
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<any> {
    try {
      // Validate refresh token and get user
      const { user } = await this.authValidator.validateRefreshTokenForRefresh(refreshTokenDto);

      // Generate new tokens
      const { accessToken, refreshToken } = await generateTokens(user, this.jwtService);

      // Update refresh token
      await this.sessionRepository.revokeRefreshToken(refreshTokenDto.refreshToken);
      await this.sessionRepository.createRefreshToken({
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        isRevoked: false,
      });

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'Token refreshed successfully',
        data: {
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            isEmailVerified: user.isEmailVerified,
            status: user.status,
          },
        },
      });
    } catch (error) {
      return handleServiceError('Error refreshing token', error);
    }
  }

  async logout(userId: number): Promise<any> {
    try {
      // Validate logout request
      await this.authValidator.validateLogout(userId);

      // Revoke all refresh tokens for the user
      await this.sessionRepository.revokeAllUserRefreshTokens(userId);

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'Logged out successfully',
        data: { userId },
      });
    } catch (error) {
      return handleServiceError('Error logging out', error);
    }
  }

  // OAUTH URL GENERATION
  async getOAuthUrl(provider: string): Promise<any> {
    try {
      // Generate OAuth URL (validation is handled in getOAuthLoginUrl)
      const oauthUrl = getOAuthLoginUrl(provider);

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'OAuth URL generated successfully',
        data: { provider, url: oauthUrl },
      });
    } catch (error) {
      return handleServiceError('Error generating OAuth URL', error);
    }
  }

  async handleOAuthCallback(query: OAuthCallbackDto): Promise<any> {
    try {
      // Validate OAuth callback (if needed, but currently just pass through)
      // Process OAuth callback
      // You may need to implement a dedicated OAuth callback handler if the return type must match OAuthCallbackResponse
      // For now, return a stub response or adapt as needed
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'OAuth callback handled successfully',
        data: query as any, // Replace with actual data if needed
      });
    } catch (error) {
      return handleServiceError('Error handling OAuth callback', error) as any;
    }
  }
}
