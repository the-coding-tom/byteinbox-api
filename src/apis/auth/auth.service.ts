import { InjectQueue } from '@nestjs/bull';
import { Injectable, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MfaMethod } from '@prisma/client';
import { Queue } from 'bull';
import { PROCESS_NOTIFICATION_QUEUE } from '../../common/constants/queues.constant';
import { Constants } from '../../common/enums/generic.enum';
import {
  createUserWithVerification,
  createMfaRequiredResponse,
  verifyOAuthCredentials,
  findOrCreateOAuthUser,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  generateAndSendOtp,
  updateUserLoginTime,
  queueNotification,
  handleServiceError,
  generateTokens,
  verifyMfaCode,
  verifyEmailOtpCode,
  verifySmsOtpCode,
} from '../../helpers/auth.helper';
import { AuthenticationHelper } from '../../helpers/authentication';
import { MfaHelper } from '../../helpers/mfa.helper';
import { OAuthHelper, OAuthUserInfo } from '../../helpers/oauth.helper';
import {
  updateProfile,
  updatePassword,
  clearPasswordReset,
  updateEmailVerification,
  updateMfa,
} from '../../helpers/user.helper';
import { AuthRepository } from '../../repositories/auth.repository';
import { UserEntity } from '../../repositories/entities/user.entity';

import { generateSuccessResponse, generateErrorResponse, throwError } from '../../utils/util';
import { AuthValidator } from './auth.validator';

import {
  RegisterDto,
  LoginDto,
  OAuthLoginDto,
  RefreshTokenDto,
  SendOtpDto,
  SetupMfaDto,
  EnableMfaDto,
  DisableMfaDto,
  VerifyEmailDto,
  ResendVerificationDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyMfaDto,
  UpdateUserProfileDto,
  ChangePasswordDto,
} from './dto/auth.dto';

import { logError } from '../../utils/logger';
@Injectable()
export class AuthService {
  constructor(
    private authRepository: AuthRepository,
    private authValidator: AuthValidator,
    private jwtService: JwtService,
    private authHelper: AuthenticationHelper,
    @InjectQueue(PROCESS_NOTIFICATION_QUEUE) private readonly notificationQueue: Queue,
  ) { }

  // AUTHENTICATION
  async register(registerDto: RegisterDto): Promise<any> {
    try {
      const validatedRegisterData = await this.authValidator.validateRegister(registerDto);
      const user = await createUserWithVerification(
        validatedRegisterData,
        this.authHelper,
        this.authRepository,
      );
      await queueNotification(
        'user-created',
        { userId: user.id, email: user.email },
        this.notificationQueue,
      );
      return generateSuccessResponse({
        statusCode: HttpStatus.CREATED,
        message: Constants.successMessage,
        data: { user: { id: user.id, email: user.email, isEmailVerified: user.isEmailVerified } },
      });
    } catch (error) {
      return handleServiceError('Error registering user', error);
    }
  }

  async login(loginDto: LoginDto): Promise<any> {
    try {
      const validatedLoginData = await this.authValidator.validateLogin(loginDto);
      const user = await this.authValidator.validateUserCredentials(
        validatedLoginData.email,
        validatedLoginData.password,
      );
      this.authValidator.checkUserLoginEligibility(user);
      if (user.mfaEnabled) {
        return generateSuccessResponse(createMfaRequiredResponse());
      }
      const tokens = await generateTokens(
        user,
        this.jwtService,
        this.authHelper,
        this.authRepository,
      );
      await updateUserLoginTime(user, this.authRepository);
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.successMessage,
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user: { id: user.id, email: user.email, isEmailVerified: user.isEmailVerified },
        },
      });
    } catch (error) {
      return handleServiceError('Error logging in', error);
    }
  }

  async oauthLogin(oauthLoginDto: OAuthLoginDto): Promise<any> {
    try {
      const validatedOAuthLoginData = await this.authValidator.validateOAuthLogin(oauthLoginDto);
      const { oauthUserInfo, accessToken } = await verifyOAuthCredentials(
        validatedOAuthLoginData,
        OAuthHelper,
      );
      const user = await findOrCreateOAuthUser(
        validatedOAuthLoginData.provider,
        oauthUserInfo,
        accessToken,
        this.authRepository,
      );
      const tokens = await generateTokens(
        user,
        this.jwtService,
        this.authHelper,
        this.authRepository,
      );
      await updateUserLoginTime(user, this.authRepository);
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.successMessage,
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user: { id: user.id, email: user.email, isEmailVerified: user.isEmailVerified },
        },
      });
    } catch (error) {
      return handleServiceError('Error with OAuth login', error);
    }
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<any> {
    try {
      const validatedRefreshTokenData
        = await this.authValidator.validateRefreshToken(refreshTokenDto);
      const refreshTokenEntity = await this.authRepository.findRefreshToken(
        validatedRefreshTokenData.refreshToken,
      );
      if (!refreshTokenEntity) {
        return generateErrorResponse({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid or expired refresh token',
          error: 'Invalid or expired refresh token',
        });
      }
      const user = await this.authRepository.findUserById(refreshTokenEntity.userId);
      if (!user?.isActive) {
        return generateErrorResponse({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'User not found or inactive',
          error: 'User not found or inactive',
        });
      }
      const tokens = await generateTokens(
        user,
        this.jwtService,
        this.authHelper,
        this.authRepository,
      );
      await this.authRepository.revokeRefreshToken(validatedRefreshTokenData.refreshToken);
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.successMessage,
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
      });
    } catch (error) {
      return handleServiceError('Error refreshing token', error);
    }
  }

  async logout(refreshToken: string): Promise<any> {
    try {
      await this.authRepository.revokeRefreshToken(refreshToken);
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.successMessage,
      });
    } catch (error) {
      return handleServiceError('Error logging out', error);
    }
  }

  // EMAIL VERIFICATION
  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<any> {
    try {
      const validatedVerifyEmailData = await this.authValidator.validateVerifyEmail(verifyEmailDto);
      const user = await this.authRepository.findUserByEmailVerificationToken(
        validatedVerifyEmailData.token,
      );
      if (!user) {
        return generateErrorResponse({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid or expired verification token',
          error: 'Invalid or expired verification token',
        });
      }
      if (user.isEmailVerified) {
        return generateErrorResponse({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Email is already verified',
          error: 'Email is already verified',
        });
      }
      const updatedUser = updateEmailVerification(user, true);
      await this.authRepository.updateUser(updatedUser);
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.successMessage,
      });
    } catch (error) {
      return handleServiceError('Error verifying email', error);
    }
  }

  async resendVerification(resendVerificationDto: ResendVerificationDto): Promise<any> {
    try {
      const validatedResendVerificationData
        = await this.authValidator.validateResendVerification(resendVerificationDto);
      const user = await this.authRepository.findUserByEmail(validatedResendVerificationData.email);
      if (!user) {
        return generateErrorResponse({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'User not found',
          error: 'User not found',
        });
      }
      if (user.isEmailVerified) {
        return generateErrorResponse({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Email is already verified',
          error: 'Email is already verified',
        });
      }
      const updatedUser = await generateEmailVerificationToken(
        user,
        this.authHelper,
        this.authRepository,
      );
      await queueNotification(
        'email-verification-sent',
        {
          userId: user.id,
          email: user.email,
          token: updatedUser.emailVerificationToken,
        },
        this.notificationQueue,
      );
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.successMessage,
      });
    } catch (error) {
      return handleServiceError('Error resending verification email', error);
    }
  }

  // PASSWORD MANAGEMENT
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<any> {
    try {
      const validatedForgotPasswordData
        = await this.authValidator.validateForgotPassword(forgotPasswordDto);
      const user = await this.authRepository.findUserByEmail(validatedForgotPasswordData.email);
      if (!user) {
        // Don't reveal if user exists for security
        return generateSuccessResponse({
          statusCode: HttpStatus.OK,
          message: 'If an account with this email exists, a password reset link has been sent',
        });
      }
      const updatedUser = await generatePasswordResetToken(
        user,
        this.authHelper,
        this.authRepository,
      );
      await queueNotification(
        'password-reset-sent',
        {
          userId: user.id,
          email: user.email,
          token: updatedUser.passwordResetToken,
        },
        this.notificationQueue,
      );
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'If an account with this email exists, a password reset link has been sent',
      });
    } catch (error) {
      return handleServiceError('Error processing forgot password', error);
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<any> {
    try {
      const validatedResetPasswordData
        = await this.authValidator.validateResetPassword(resetPasswordDto);
      const user = await this.authRepository.findUserByPasswordResetToken(
        validatedResetPasswordData.token,
      );
      if (!user) {
        return generateErrorResponse({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid or expired reset token',
          error: 'Invalid or expired reset token',
        });
      }
      const hashedPassword = await this.authHelper.hashPassword(
        validatedResetPasswordData.password,
      );
      const updatedUser = clearPasswordReset(updatePassword(user, hashedPassword));
      await this.authRepository.updateUser(updatedUser);
      await queueNotification(
        'password-reset-completed',
        {
          userId: user.id,
          email: user.email,
        },
        this.notificationQueue,
      );
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.successMessage,
      });
    } catch (error) {
      return handleServiceError('Error resetting password', error);
    }
  }

  async changePassword(userId: number, changePasswordDto: ChangePasswordDto): Promise<any> {
    try {
      const validatedChangePasswordData
        = await this.authValidator.validateChangePassword(changePasswordDto);
      const user = await this.authValidator.getUserByIdOrFail(userId);
      await this.authValidator.validatePasswordChange(user, validatedChangePasswordData.currentPassword);
      const hashedPassword = await this.authHelper.hashPassword(
        validatedChangePasswordData.newPassword,
      );
      const updatedUser = updatePassword(user, hashedPassword);
      await this.authRepository.updateUser(updatedUser);
      await queueNotification(
        'password-changed',
        {
          userId: user.id,
          email: user.email,
        },
        this.notificationQueue,
      );
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.successMessage,
      });
    } catch (error) {
      return handleServiceError('Error changing password', error);
    }
  }

  // MFA
  async setupMfa(userId: number, setupMfaDto: SetupMfaDto): Promise<any> {
    try {
      const validatedSetupMfaData = await this.authValidator.validateSetupMfa(setupMfaDto);
      const user = await this.authValidator.getUserByIdOrFail(userId);
      if (user.mfaEnabled) {
        return generateErrorResponse({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'MFA is already enabled',
          error: 'MFA is already enabled',
        });
      }
      const { secret, qrCode } = await MfaHelper.setupTotp(user.email);
      const updatedUser = updateMfa(user, {
        totpSecret: secret,
        mfaEnabled: false,
      });
      await this.authRepository.updateUser(updatedUser);
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'MFA setup completed',
        data: { qrCode, secret },
      });
    } catch (error) {
      return handleServiceError('Error setting up MFA', error);
    }
  }

  async enableMfa(userId: number, enableMfaDto: EnableMfaDto): Promise<any> {
    try {
      const validatedEnableMfaData = await this.authValidator.validateEnableMfa(enableMfaDto);
      const user = await this.authValidator.getUserByIdOrFail(userId);
      if (!user.totpSecret) {
        return generateErrorResponse({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'MFA not set up. Please set up MFA first',
          error: 'MFA not set up. Please set up MFA first',
        });
      }
      if (user.mfaEnabled) {
        return generateErrorResponse({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'MFA is already enabled',
          error: 'MFA is already enabled',
        });
      }
      const isValidCode = MfaHelper.verifyTotpCode(user.totpSecret, validatedEnableMfaData.code);
      if (!isValidCode) {
        return generateErrorResponse({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid verification code',
          error: 'Invalid verification code',
        });
      }
      const updatedUser = updateMfa(user, {
        mfaEnabled: true,
        mfaMethod: MfaMethod.totp,
      });
      await this.authRepository.updateUser(updatedUser);
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'MFA enabled successfully',
      });
    } catch (error) {
      return handleServiceError('Error enabling MFA', error);
    }
  }

  async disableMfa(userId: number, disableMfaDto: DisableMfaDto): Promise<any> {
    try {
      const validatedDisableMfaData = await this.authValidator.validateDisableMfa(disableMfaDto);
      const user = await this.authValidator.getUserByIdOrFail(userId);
      if (!user.mfaEnabled) {
        return generateErrorResponse({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'MFA is not enabled',
          error: 'MFA is not enabled',
        });
      }
      const isValidCode = MfaHelper.verifyTotpCode(user.totpSecret!, validatedDisableMfaData.code);
      if (!isValidCode) {
        return generateErrorResponse({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid verification code',
          error: 'Invalid verification code',
        });
      }
      const updatedUser = updateMfa(user, {
        mfaEnabled: false,
        mfaMethod: null,
        totpSecret: undefined,
      });
      await this.authRepository.updateUser(updatedUser);
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'MFA disabled successfully',
      });
    } catch (error) {
      return handleServiceError('Error disabling MFA', error);
    }
  }

  async verifyMfa(userId: number, verifyMfaDto: VerifyMfaDto): Promise<any> {
    try {
      const validatedVerifyMfaData = await this.authValidator.validateVerifyMfa(verifyMfaDto);
      const user = await this.authValidator.getUserByIdOrFail(userId);
      if (!user.mfaEnabled) {
        return generateErrorResponse({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'MFA is not enabled',
          error: 'MFA is not enabled',
        });
      }
      const isValidCode = await verifyMfaCode(
        user,
        validatedVerifyMfaData.code,
        validatedVerifyMfaData.method,
        this.authRepository,
      );
      if (!isValidCode) {
        return generateErrorResponse({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid verification code',
          error: 'Invalid verification code',
        });
      }
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'MFA verification successful',
      });
    } catch (error) {
      return handleServiceError('Error verifying MFA', error);
    }
  }

  // OTP
  async sendOtp(userId: number, sendOtpDto: SendOtpDto): Promise<any> {
    try {
      const validatedSendOtpData = await this.authValidator.validateSendOtp(sendOtpDto);
      const user = await this.authValidator.getUserByIdOrFail(userId);
      const otp = await generateAndSendOtp(
        user,
        validatedSendOtpData.method,
        this.authHelper,
        this.authRepository,
      );
      await queueNotification(
        'otp-sent',
        {
          userId: user.id,
          method: validatedSendOtpData.method,
          otp,
        },
        this.notificationQueue,
      );
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: `OTP sent to your ${validatedSendOtpData.method}`,
      });
    } catch (error) {
      return handleServiceError('Error sending OTP', error);
    }
  }

  async verifyEmailOtp(email: string, otp: string): Promise<any> {
    try {
      const isValid = await verifyEmailOtpCode({ email } as UserEntity, otp, this.authRepository);
      if (!isValid) {
        return generateErrorResponse({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid or expired OTP',
          error: 'Invalid or expired OTP',
        });
      }
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.successMessage,
      });
    } catch (error) {
      return handleServiceError('Error verifying email OTP', error);
    }
  }

  async verifySmsOtp(phoneNumber: string, otp: string): Promise<any> {
    try {
      const isValid = await verifySmsOtpCode(
        { phoneNumber } as UserEntity,
        otp,
        this.authRepository,
      );
      if (!isValid) {
        return generateErrorResponse({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid or expired OTP',
          error: 'Invalid or expired OTP',
        });
      }
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.successMessage,
      });
    } catch (error) {
      return handleServiceError('Error verifying SMS OTP', error);
    }
  }

  async verifyTotp(code: string): Promise<any> {
    try {
      const isValid = MfaHelper.verifyTotpCode('', code); // This needs proper implementation
      if (!isValid) {
        return generateErrorResponse({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid TOTP code',
          error: 'Invalid TOTP code',
        });
      }
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.successMessage,
      });
    } catch (error) {
      return handleServiceError('Error verifying TOTP', error);
    }
  }

  // USER PROFILE
  async getProfile(userId: number): Promise<any> {
    try {
      const user = await this.authValidator.getUserByIdOrFail(userId);
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.successMessage,
        data: { id: user.id, email: user.email, isEmailVerified: user.isEmailVerified },
      });
    } catch (error) {
      return handleServiceError('Error retrieving profile', error);
    }
  }

  async updateProfile(userId: number, updateProfileDto: UpdateUserProfileDto): Promise<any> {
    try {
      const validatedUpdateProfileData
        = await this.authValidator.validateUpdateProfile(updateProfileDto);
      const user = await this.authValidator.getUserByIdOrFail(userId);
      const updatedUser = updateProfile(user, validatedUpdateProfileData);
      await this.authRepository.updateUser(updatedUser);
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.successMessage,
        data: {
          id: updatedUser.id,
          email: updatedUser.email,
          isEmailVerified: updatedUser.isEmailVerified,
        },
      });
    } catch (error) {
      return handleServiceError('Error updating profile', error);
    }
  }

  // ACCOUNT MANAGEMENT
  async deactivateAccount(userId: number): Promise<any> {
    try {
      const user = await this.authValidator.getUserByIdOrFail(userId);
      const updatedUser = { ...user, isActive: false };
      await this.authRepository.updateUser(updatedUser);
      await queueNotification(
        'account-deactivated',
        {
          userId: user.id,
          email: user.email,
        },
        this.notificationQueue,
      );
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.successMessage,
      });
    } catch (error) {
      return handleServiceError('Error deactivating account', error);
    }
  }

  async deleteAccount(userId: number, password: string): Promise<any> {
    try {
      const user = await this.authValidator.getUserByIdOrFail(userId);
      if (!user.password) {
        return generateErrorResponse({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Cannot delete OAuth account with password',
          error: 'Cannot delete OAuth account with password',
        });
      }
      const isPasswordValid = await this.authHelper.validatePassword(password, user.password);
      if (!isPasswordValid) {
        return generateErrorResponse({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid password',
          error: 'Invalid password',
        });
      }
      await this.authRepository.deleteUser(userId);
      await queueNotification(
        'account-deleted',
        {
          userId: user.id,
          email: user.email,
        },
        this.notificationQueue,
      );
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.successMessage,
      });
    } catch (error) {
      return handleServiceError('Error deleting account', error);
    }
  }

  async unlockAccount(userId: number): Promise<any> {
    try {
      const user = await this.authValidator.getUserByIdOrFail(userId);
      const updatedUser = { ...user, isActive: true };
      await this.authRepository.updateUser(updatedUser);
      await queueNotification(
        'account-unlocked',
        {
          userId: user.id,
          email: user.email,
        },
        this.notificationQueue,
      );
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.successMessage,
      });
    } catch (error) {
      return handleServiceError('Error unlocking account', error);
    }
  }

  // SESSION MANAGEMENT
  async getActiveSessions(userId: number): Promise<any> {
    try {
      const validatedGetActiveSessionsUserId
        = await this.authValidator.validateGetActiveSessions(userId);
      const user = await this.authValidator.getUserByIdOrFail(validatedGetActiveSessionsUserId);
      const sessions = await this.authRepository.getActiveSessions(
        validatedGetActiveSessionsUserId,
      );
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.successMessage,
        data: sessions,
      });
    } catch (error) {
      return handleServiceError('Error retrieving active sessions', error);
    }
  }

  async revokeAllSessions(userId: number): Promise<any> {
    try {
      const validatedRevokeAllSessionsUserId
        = await this.authValidator.validateRevokeAllSessions(userId);
      const user = await this.authValidator.getUserByIdOrFail(validatedRevokeAllSessionsUserId);
      await this.authRepository.revokeAllSessions(validatedRevokeAllSessionsUserId);
      await queueNotification(
        'sessions-revoked',
        {
          userId: user.id,
          email: user.email,
        },
        this.notificationQueue,
      );
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.successMessage,
      });
    } catch (error) {
      return handleServiceError('Error revoking sessions', error);
    }
  }

  // SECURITY & ADMIN
  async getSecurityActivity(userId: number): Promise<any> {
    try {
      const validatedGetSecurityActivityUserId
        = await this.authValidator.validateGetSecurityActivity(userId);
      const user = await this.authValidator.getUserByIdOrFail(validatedGetSecurityActivityUserId);
      const securityActivity = await this.authRepository.getSecurityActivity(
        validatedGetSecurityActivityUserId,
      );
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.successMessage,
        data: securityActivity,
      });
    } catch (error) {
      return handleServiceError('Error retrieving security activity', error);
    }
  }

  async resetUserMfa(userId: number): Promise<any> {
    try {
      const validatedResetUserMfaUserId = await this.authValidator.validateResetUserMfa(userId);
      const user = await this.authValidator.getUserByIdOrFail(validatedResetUserMfaUserId);
      const updatedUser = updateMfa(user, {
        mfaEnabled: false,
        mfaMethod: null,
      });
      await this.authRepository.updateUser(updatedUser);
      await queueNotification(
        'mfa-reset',
        {
          userId: user.id,
          email: user.email,
        },
        this.notificationQueue,
      );
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.successMessage,
      });
    } catch (error) {
      return handleServiceError('Error resetting user MFA', error);
    }
  }

  // OAUTH
  async getOAuthUrl(provider: string, redirectUri: string): Promise<any> {
    try {
      const oauthUrl = OAuthHelper.getOAuthLoginUrl(provider, redirectUri);
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.successMessage,
        data: { oauthUrl },
      });
    } catch (error) {
      return handleServiceError('Error generating OAuth URL', error);
    }
  }

  async handleOAuthCallback(query: any): Promise<any> {
    try {
      const validatedOAuthCallbackData = await this.authValidator.validateOAuthCallback(query);
      if (validatedOAuthCallbackData.error) {
        return generateErrorResponse({
          statusCode: HttpStatus.BAD_REQUEST,
          message: `OAuth error: ${validatedOAuthCallbackData.error}`,
          error: `OAuth error: ${validatedOAuthCallbackData.error}`,
        });
      }
      if (!validatedOAuthCallbackData.code) {
        return generateErrorResponse({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'No authorization code received',
          error: 'No authorization code received',
        });
      }
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.successMessage,
        data: {
          code: validatedOAuthCallbackData.code,
          state: validatedOAuthCallbackData.state,
          instructions: 'Copy the code above and use it with the /api/v1/auth/oauth/login endpoint',
          testCommand: `curl -X POST http://localhost:3000/api/v1/auth/oauth/login -H "Content-Type: application/json" -d '{"provider": "google", "code": "${validatedOAuthCallbackData.code}"}'`,
        },
      });
    } catch (error) {
      return handleServiceError('Error handling OAuth callback', error);
    }
  }
}
