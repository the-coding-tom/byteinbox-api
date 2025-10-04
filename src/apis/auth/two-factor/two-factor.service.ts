import { Injectable, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { v4 as uuidv4 } from 'uuid';

import { UserRepository } from '../../../repositories/user.repository';
import { MfaRepository } from '../../../repositories/mfa.repository';
import { BackupCodeRepository } from '../../../repositories/backup-code.repository';

import { LoginActivityRepository } from '../../../repositories/login-activity.repository';
import { TwoFactorValidator } from './two-factor.validator';
import { generateSuccessResponse, throwError } from '../../../utils/util';
import { handleServiceError } from '../../../utils/error.util';
import { setupTotp, generateBackupCodes, hashBackupCode } from '../../../helpers/mfa.helper';
import { generateTokens, updateUserLoginTime } from '../../../utils/authentication.util';
import { PROCESS_NOTIFICATION_QUEUE } from '../../../common/constants/queues.constant';
import {
  TwoFactorStatusDto,
  TotpSetupResponseDto,
  TotpVerifySetupDto,
  TotpVerifySetupResponseDto,
  TotpDisableDto,
  BackupCodesResponseDto,
  RegenerateBackupCodesDto,
  RegenerateBackupCodesResponseDto,
  EmailOtpSendDto,
  EmailOtpVerifyDto,
  EmailOtpVerifyResponseDto,
  TwoFactorVerifyDto,
  RecoveryInitiateDto,
  RecoveryVerifyDto,
  TwoFactorSettingsDto,
  TwoFactorActivityDto,
  AuthResponse,
} from './dto';


@Injectable()
export class TwoFactorService {
  constructor(
    private userRepository: UserRepository,
    private mfaRepository: MfaRepository,
    private backupCodeRepository: BackupCodeRepository,

    private loginActivityRepository: LoginActivityRepository,
    private twoFactorValidator: TwoFactorValidator,
    private jwtService: JwtService,
    @InjectQueue(PROCESS_NOTIFICATION_QUEUE)
    private readonly notificationQueue: Queue,
  ) {}

  // 2FA STATUS & SETUP

  async getTwoFactorStatus(userId: number): Promise<AuthResponse> {
    try {
      // Validate user and get basic info
      const user = await this.twoFactorValidator.validateGetTwoFactorStatus(userId);
      const hasTotp = user.totpEnabled;
      
      // Get backup codes information
      const backupCodes = await this.backupCodeRepository.findByUserId(userId);
      const remainingBackupCodes = backupCodes.filter(code => !code.isUsed).length;
      
      // Build response object
      const response: TwoFactorStatusDto = {
        enabled: hasTotp || remainingBackupCodes > 0,
        methods: {
          totp: {
            enabled: hasTotp,
            setup_at: hasTotp ? user.updatedAt : undefined,
          },
          backup_codes: {
            enabled: remainingBackupCodes > 0,
            remaining_count: remainingBackupCodes,
            generated_at: backupCodes.length > 0 ? backupCodes[0].createdAt : undefined,
          },
          email_otp: {
            enabled: true, // Always available as fallback
            email: user.email,
          },
        },
      };

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: '2FA status retrieved successfully',
        data: response,
      });
    } catch (error) {
      return handleServiceError('Error retrieving 2FA status', error);
    }
  }

  // TOTP MANAGEMENT

  async setupTotp(userId: number): Promise<AuthResponse> {
    try {
      // Validate user and check TOTP status
      const user = await this.twoFactorValidator.validateSetupTotp(userId);

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
        statusCode: HttpStatus.OK,
        message: 'TOTP setup initiated successfully',
        data: response,
      });
    } catch (error) {
      return handleServiceError('Error setting up TOTP', error);
    }
  }

  async verifyTotpSetup(userId: number, verifySetupDto: TotpVerifySetupDto): Promise<AuthResponse> {
    try {
      // Validate user and verification data
      await this.twoFactorValidator.validateVerifyTotpSetup(userId, verifySetupDto);

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
        backup_codes: backupCodes.map(code => this.maskBackupCode(code)),
      };

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'TOTP setup completed successfully',
        data: response,
      });
    } catch (error) {
      return handleServiceError('Error verifying TOTP setup', error);
    }
  }

  async disableTotp(userId: number, disableDto: TotpDisableDto): Promise<AuthResponse> {
    try {
      // Validate user and disable request
      await this.twoFactorValidator.validateDisableTotp(userId, disableDto);

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
        ipAddress: 'unknown', // Could be passed from request context
        userAgent: 'unknown', // Could be passed from request context
        success: true,
        activityType: '2FA_TOTP_DISABLE',
      });

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'TOTP disabled successfully',
      });
    } catch (error) {
      return handleServiceError('Error disabling TOTP', error);
    }
  }

  // BACKUP CODES MANAGEMENT

  async getBackupCodes(userId: number): Promise<AuthResponse> {
    try {
      // Validate user access
      await this.twoFactorValidator.validateGetBackupCodes(userId);
      
      // Get and filter backup codes
      const backupCodes = await this.backupCodeRepository.findByUserId(userId);
      const unusedCodes = backupCodes.filter(code => !code.isUsed);
      
      // Build response
      const response: BackupCodesResponseDto = {
        remaining_count: unusedCodes.length,
        codes: unusedCodes.map(code => this.maskBackupCode(code.code)),
      };

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'Backup codes retrieved successfully',
        data: response,
      });
    } catch (error) {
      return handleServiceError('Error retrieving backup codes', error);
    }
  }

  async regenerateBackupCodes(userId: number, regenerateDto: RegenerateBackupCodesDto): Promise<AuthResponse> {
    try {
      // Validate user and regeneration request
      await this.twoFactorValidator.validateRegenerateBackupCodes(userId, regenerateDto);

      // Remove existing backup codes
      await this.backupCodeRepository.deleteByUserId(userId);

      // Generate and store new backup codes
      const backupCodes = await generateBackupCodes();
      const hashedCodes = await Promise.all(backupCodes.map(code => hashBackupCode(code)));
      await this.backupCodeRepository.createBackupCodes(userId, hashedCodes);

      // Build response
      const response: RegenerateBackupCodesResponseDto = {
        backup_codes: backupCodes.map(code => this.maskBackupCode(code)),
        message: 'Backup codes regenerated successfully',
      };

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'Backup codes regenerated successfully',
        data: response,
      });
    } catch (error) {
      return handleServiceError('Error regenerating backup codes', error);
    }
  }

  // EMAIL OTP MANAGEMENT

  async sendEmailOtp(sendDto: EmailOtpSendDto): Promise<AuthResponse> {
    try {
      // Validate the request
      await this.twoFactorValidator.validateEmailOtpSend(sendDto);
      
      // Generate OTP and set expiration
      const otp = Math.floor(100000 + Math.random() * 900000).toString();


      // Queue email notification
      await this.notificationQueue.add('send-email-otp', {
        sessionToken: sendDto.session_token,
        otp,
        reason: sendDto.reason,
      });

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'Email OTP sent successfully',
        data: {
          session_token: sendDto.session_token,
          expires_in: 600, // 10 minutes
        },
      });
    } catch (error) {
      return handleServiceError('Error sending email OTP', error);
    }
  }

  async verifyEmailOtp(verifyDto: EmailOtpVerifyDto): Promise<AuthResponse> {
    try {
      // Validate the OTP
      await this.twoFactorValidator.validateEmailOtpVerify(verifyDto);
      
      // Get user from session
      const session = await this.mfaRepository.getSessionByToken(verifyDto.session_token);
      if (!session) {
        throwError('Invalid session', HttpStatus.BAD_REQUEST, 'invalidSession');
      }

      // Verify the email OTP
      const isValid = await this.mfaRepository.verifyEmailOtp(verifyDto.session_token, verifyDto.code);
      if (!isValid) {
        throwError('Invalid OTP code', HttpStatus.BAD_REQUEST, 'invalidOtpCode');
      }

      // Mark session as verified
      await this.mfaRepository.markMfaSessionAsVerified(verifyDto.session_token);

      // Log successful 2FA verification
      await this.loginActivityRepository.createTwoFactorActivity({
        userId: session.userId,
        ipAddress: 'unknown', // Could be passed from request context
        userAgent: 'unknown', // Could be passed from request context
        success: true,
        activityType: '2FA_VERIFICATION_SUCCESS',
      });

      const response: EmailOtpVerifyResponseDto = {
        success: true,
        message: 'Email OTP verified successfully',
      };

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'Email OTP verified successfully',
        data: response,
      });
    } catch (error) {
      return handleServiceError('Error verifying email OTP', error);
    }
  }

  // TWO-FACTOR VERIFICATION

  async verifyTwoFactor(verifyDto: TwoFactorVerifyDto, req?: any): Promise<AuthResponse> {
    try {
      // Validate everything using comprehensive validator
      const { validatedData, session, user } = await this.twoFactorValidator.validateVerifyTwoFactor(verifyDto);

      // Handle backup code usage (mark as used if it was a backup code)
      if (validatedData.method === 'backup_code') {
        const backupCodes = await this.backupCodeRepository.findByUserId(session.userId);
        const hashedCode = await hashBackupCode(validatedData.code);
        const matchingCode = backupCodes.find(code => 
          !code.isUsed && code.code === hashedCode
        );
        if (matchingCode) {
          await this.backupCodeRepository.markAsUsed(matchingCode.id);
        }
      }

      // Generate tokens
      const tokens = await generateTokens(user, this.jwtService);
      await updateUserLoginTime(user, this.userRepository);

      // Log successful 2FA verification
      await this.loginActivityRepository.create({
        userId: session.userId,
        ipAddress: req?.ip || 'unknown',
        userAgent: req?.headers?.['user-agent'] || 'unknown',
        success: true,
      });

      // Clear the session
      await this.mfaRepository.cleanupExpiredMfaSessions();

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: '2FA verification successful',
        data: tokens,
      });
    } catch (error) {
      return handleServiceError('Error verifying 2FA', error);
    }
  }

  // RECOVERY MANAGEMENT

  async initiateRecovery(initiateDto: RecoveryInitiateDto): Promise<AuthResponse> {
    try {
      // Validate the request
      await this.twoFactorValidator.validateRecoveryInitiate(initiateDto);
      
      // Check if user exists
      const user = await this.userRepository.findByEmail(initiateDto.email);
      if (!user) {
        throwError('User not found', HttpStatus.NOT_FOUND, 'userNotFound');
      }

      // Generate recovery token
      const recoveryToken = uuidv4();
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      // Store recovery session
      await this.mfaRepository.createRecoverySession(recoveryToken, user.id, expiresAt);

      // Send recovery email
      await this.notificationQueue.add('send-2fa-recovery', {
        email: user.email,
        recoveryToken,
      });

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'Recovery email sent successfully',
        data: {
          recovery_token: recoveryToken,
          expires_in: 1800, // 30 minutes
        },
      });
    } catch (error) {
      return handleServiceError('Error initiating 2FA recovery', error);
    }
  }

  async verifyRecovery(verifyDto: RecoveryVerifyDto): Promise<AuthResponse> {
    try {
      // Validate the recovery
      await this.twoFactorValidator.validateRecoveryVerify(verifyDto);
      
      // Get recovery session
      const recoverySession = await this.mfaRepository.getRecoverySession(verifyDto.recovery_token);
      if (!recoverySession) {
        throwError('Invalid recovery token', HttpStatus.BAD_REQUEST, 'invalidRecoveryToken');
      }

      // Verify backup code
      const backupCodes = await this.backupCodeRepository.findByUserId(recoverySession.userId);
      const hashedCode = await hashBackupCode(verifyDto.new_password);
      const matchingCode = backupCodes.find(code => 
        !code.isUsed && code.code === hashedCode
      );
      
      if (!matchingCode) {
        throwError('Invalid backup code', HttpStatus.BAD_REQUEST, 'invalidBackupCode');
      }

      // Mark backup code as used
      if (matchingCode) {
        await this.backupCodeRepository.markAsUsed(matchingCode.id);
      }

      // Mark recovery session as used
      await this.mfaRepository.markRecoverySessionAsUsed(verifyDto.recovery_token);

      // Generate tokens
      const tokens = await generateTokens(recoverySession.userId, this.jwtService);
      const user = await this.userRepository.findById(recoverySession.userId);
      if (user) {
        await updateUserLoginTime(user, this.userRepository);
      }

      // Log successful recovery
      await this.loginActivityRepository.createTwoFactorActivity({
        userId: recoverySession.userId,
        ipAddress: 'unknown', // Could be passed from request context
        userAgent: 'unknown', // Could be passed from request context
        success: true,
        activityType: '2FA_RECOVERY_SUCCESS',
      });

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: '2FA recovery successful',
        data: tokens,
      });
    } catch (error) {
      return handleServiceError('Error verifying 2FA recovery', error);
    }
  }

  // SETTINGS & ACTIVITY

  async updateTwoFactorSettings(userId: number, settingsDto: TwoFactorSettingsDto): Promise<AuthResponse> {
    try {
      await this.twoFactorValidator.validateTwoFactorSettings(userId, settingsDto);
      
      // Update settings
      const updateData: any = {};
      if (settingsDto.email_notifications !== undefined) {
        updateData.emailNotifications = settingsDto.email_notifications;
      }
      if (settingsDto.backup_email !== undefined) {
        updateData.backupEmail = settingsDto.backup_email;
      }
      if (settingsDto.require_2fa_for_api_access !== undefined) {
        updateData.require2faForApiAccess = settingsDto.require_2fa_for_api_access;
      }

      await this.userRepository.update(userId, updateData);

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: '2FA settings updated successfully',
      });
    } catch (error) {
      return handleServiceError('Error updating 2FA settings', error);
    }
  }

  async getTwoFactorActivity(userId: number): Promise<AuthResponse> {
    try {
      await this.twoFactorValidator.validateGetTwoFactorActivity(userId);
      
      // Get recent 2FA activity
      const activities = await this.loginActivityRepository.findTwoFactorActivityByUserId(userId, 50);

      // Transform activities to match the DTO format
      const recentActivity = activities.map(activity => ({
        timestamp: activity.createdAt,
        method: '2FA', // We can enhance this to track specific methods
        action: activity.success ? 'VERIFICATION_SUCCESS' : 'VERIFICATION_FAILED',
        ip_address: activity.ipAddress,
        user_agent: activity.userAgent,
        status: activity.success ? ('success' as const) : ('failed' as const),
      }));

      const response: TwoFactorActivityDto = {
        recent_activity: recentActivity,
      };

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: '2FA activity retrieved successfully',
        data: response,
      });
    } catch (error) {
      return handleServiceError('Error retrieving 2FA activity', error);
    }
  }

  // UTILITY METHODS



  private maskBackupCode(code: string): string {
    return code.substring(0, 4) + '****';
  }
} 