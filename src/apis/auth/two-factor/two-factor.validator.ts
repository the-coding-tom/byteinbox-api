import { Injectable, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as Joi from 'joi';

import { UserRepository } from '../../../repositories/user.repository';
import { MfaRepository } from '../../../repositories/mfa.repository';
import { BackupCodeRepository } from '../../../repositories/backup-code.repository';

import { throwError } from '../../../utils/util';
import { validatePassword } from '../../../utils/authentication.util';
import { config } from '../../../config/config';
import { verifyTotpCode } from '../../../helpers/mfa.helper';
import {
  TotpVerifySetupDto,
  TotpDisableDto,
  RegenerateBackupCodesDto,
  EmailOtpSendDto,
  EmailOtpVerifyDto,
  TwoFactorVerifyDto,
  RecoveryInitiateDto,
  RecoveryVerifyDto,
  TwoFactorSettingsDto,
} from './dto';
import { UserEntity } from '../../../repositories/entities/user.entity';
import { validateJoiSchema } from '../../../utils/joi.validator';
import { hashBackupCode } from '../../../helpers/mfa.helper';

@Injectable()
export class TwoFactorValidator {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly mfaRepository: MfaRepository,
    private readonly backupCodeRepository: BackupCodeRepository,

    private readonly jwtService: JwtService,
  ) {}

  // 2FA STATUS & SETUP VALIDATION

  async validateGetTwoFactorStatus(userId: number): Promise<UserEntity> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throwError('User not found', HttpStatus.NOT_FOUND, 'userNotFound');
    }
    return user as UserEntity;
  }

  // TOTP VALIDATION

  async validateSetupTotp(userId: number): Promise<UserEntity> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throwError('User not found', HttpStatus.NOT_FOUND, 'userNotFound');
    }

    // Check if TOTP is already enabled
    if (user.totpEnabled) {
      throwError('TOTP is already enabled', HttpStatus.BAD_REQUEST, 'totpAlreadyEnabled');
    }

    return user as UserEntity;
  }

  async validateVerifyTotpSetup(userId: number, data: TotpVerifySetupDto): Promise<{ validatedData: TotpVerifySetupDto; user: UserEntity }> {
    // Validate input data
    const schema = Joi.object({
      code: Joi.string()
        .length(6)
        .pattern(/^\d{6}$/)
        .required()
        .messages({
          'string.length': 'TOTP code must be exactly 6 digits',
          'string.pattern.base': 'TOTP code must contain only digits',
          'any.required': 'TOTP code is required',
        }),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    // Get user and validate
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throwError('User not found', HttpStatus.NOT_FOUND, 'userNotFound');
    }

    // Check if TOTP is already enabled
    if (user.totpEnabled) {
      throwError('TOTP is already enabled', HttpStatus.BAD_REQUEST, 'totpAlreadyEnabled');
    }

    // Validate the verification code
    if (!user.totpSecret) {
      throwError('TOTP setup not found or expired', HttpStatus.BAD_REQUEST, 'totpSetupNotFound');
    }

    const isValid = await verifyTotpCode(user.totpSecret!, data.code);
    if (!isValid) {
      throwError('Invalid verification code', HttpStatus.BAD_REQUEST, 'invalidTotpCode');
    }

    return { validatedData: data, user };
  }

  async validateDisableTotp(userId: number, data: TotpDisableDto): Promise<{ validatedData: TotpDisableDto; user: UserEntity }> {
    // Validate input data
    const schema = Joi.object({
      verification_code: Joi.string()
        .length(6)
        .pattern(/^\d{6}$/)
        .required()
        .messages({
          'string.length': 'Verification code must be exactly 6 digits',
          'string.pattern.base': 'Verification code must contain only digits',
          'any.required': 'Verification code is required',
        }),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    // Get user and validate
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throwError('User not found', HttpStatus.NOT_FOUND, 'userNotFound');
    }

    // Verify TOTP is enabled
    if (!user.totpEnabled || !user.totpSecret) {
      throwError('TOTP not enabled', HttpStatus.BAD_REQUEST, 'totpNotEnabled');
    }

    // Verify the TOTP code
    const isValid = await verifyTotpCode(user.totpSecret!, data.verification_code);
    if (!isValid) {
      throwError('Invalid verification code', HttpStatus.BAD_REQUEST, 'invalidTotpCode');
    }

    return { validatedData: data, user };
  }

  // BACKUP CODES VALIDATION

  async validateGetBackupCodes(userId: number): Promise<UserEntity> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throwError('User not found', HttpStatus.NOT_FOUND, 'userNotFound');
    }
    return user as UserEntity;
  }

  async validateRegenerateBackupCodes(userId: number, data: RegenerateBackupCodesDto): Promise<{ validatedData: RegenerateBackupCodesDto; user: UserEntity }> {
    // Validate input data
    const schema = Joi.object({
      current_password: Joi.string().required().messages({
        'any.required': 'Current password is required',
      }),
      verification_method: Joi.string().valid('totp', 'email_otp').required().messages({
        'any.only': 'Verification method must be either "totp" or "email_otp"',
        'any.required': 'Verification method is required',
      }),
      verification_code: Joi.string().min(6).max(8).required().messages({
        'string.min': 'Verification code must be at least 6 characters',
        'string.max': 'Verification code must not exceed 8 characters',
        'any.required': 'Verification code is required',
      }),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    // Get user and validate
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throwError('User not found', HttpStatus.NOT_FOUND, 'userNotFound');
    }

    const validatedUser = user as UserEntity;

    // Validate current password
    if (!validatedUser.password) {
      throwError(
        'Cannot regenerate backup codes for OAuth users',
        HttpStatus.BAD_REQUEST,
        'oauthUserBackupCodes',
      );
    }

    const isCurrentPasswordValid = await validatePassword(data.current_password, validatedUser.password as string);
    if (!isCurrentPasswordValid) {
      throwError(
        'Current password is incorrect',
        HttpStatus.BAD_REQUEST,
        'incorrectCurrentPassword',
      );
    }

    // Validate verification method and code
    if (data.verification_method === 'totp') {
      if (!validatedUser.totpSecret) {
        throwError('TOTP not enabled', HttpStatus.BAD_REQUEST, 'totpNotEnabled');
      }
      const isValid = await verifyTotpCode(data.verification_code, validatedUser.totpSecret!);
      if (!isValid) {
        throwError('Invalid TOTP code', HttpStatus.BAD_REQUEST, 'invalidTotpCode');
      }
    } else if (data.verification_method === 'email_otp') {
      // Validate email OTP code (would need to be implemented)
      // For now, just check if it's a valid format
      if (data.verification_code.length < 6 || data.verification_code.length > 8) {
        throwError('Invalid email OTP code', HttpStatus.BAD_REQUEST, 'invalidEmailOtpCode');
      }
    }

    return { validatedData: data, user: validatedUser };
  }

  // EMAIL OTP VALIDATION

  async validateEmailOtpSend(data: EmailOtpSendDto): Promise<EmailOtpSendDto> {
    const schema = Joi.object({
      session_token: Joi.string().required().messages({
        'any.required': 'Session token is required',
      }),
      reason: Joi.string().valid('login', 'recovery', 'verification').required().messages({
        'any.only': 'Reason must be one of: login, recovery, verification',
        'any.required': 'Reason is required',
      }),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    // Validate session token
    try {
      const decoded = this.jwtService.verify(data.session_token);
      if (!decoded.userId) {
        throwError('Invalid session token', HttpStatus.UNAUTHORIZED, 'invalidSessionToken');
      }
    } catch (error) {
      throwError('Invalid session token', HttpStatus.UNAUTHORIZED, 'invalidSessionToken');
    }

    return data;
  }

  async validateEmailOtpVerify(data: EmailOtpVerifyDto): Promise<EmailOtpVerifyDto> {
    const schema = Joi.object({
      session_token: Joi.string().required().messages({
        'any.required': 'Session token is required',
      }),
      code: Joi.string().min(6).max(8).required().messages({
        'string.min': 'Verification code must be at least 6 characters',
        'string.max': 'Verification code must not exceed 8 characters',
        'any.required': 'Verification code is required',
        }),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    return data;
  }

  async validateVerifyTwoFactor(data: TwoFactorVerifyDto): Promise<{ validatedData: TwoFactorVerifyDto; session: any; user: UserEntity }> {
    // 1. Validate DTO schema
    const schema = Joi.object({
      session_token: Joi.string().required().messages({
        'any.required': 'Session token is required',
      }),
      method: Joi.string().valid('totp', 'backup_code', 'email_otp').required().messages({
        'any.only': 'Method must be one of: totp, backup_code, email_otp',
        'any.required': 'Method is required',
      }),
      code: Joi.string().min(6).max(8).required().messages({
        'string.min': 'Verification code must be at least 6 characters',
        'string.max': 'Verification code must not exceed 8 characters',
        'any.required': 'Verification code is required',
      }),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    // 2. Get and validate session
    const session = await this.mfaRepository.findMfaSessionByToken(data.session_token);
    if (!session) {
      throwError('Invalid session', HttpStatus.BAD_REQUEST, 'invalidSession');
    }

    // 3. Get and validate user
    const user = await this.userRepository.findById(session.userId);
    if (!user) {
      throwError('User not found', HttpStatus.NOT_FOUND, 'userNotFound');
    }

    // 4. Validate based on method
    switch (data.method) {
      case 'totp': {
        if (!user.totpEnabled) {
          throwError('TOTP not enabled', HttpStatus.BAD_REQUEST, 'totpNotEnabled');
        }
        if (!user.totpSecret) {
          throwError('TOTP secret not found', HttpStatus.BAD_REQUEST, 'totpSecretNotFound');
        }
        const isValidTotp = await verifyTotpCode(user.totpSecret!, data.code);
        if (!isValidTotp) {
          throwError('Invalid TOTP code', HttpStatus.BAD_REQUEST, 'invalidTotpCode');
        }
        break;
      }

      case 'backup_code': {
        const backupCodes = await this.backupCodeRepository.findByUserId(session.userId);
        const hashedCode = await hashBackupCode(data.code);
        const matchingCode = backupCodes.find(code => 
          !code.isUsed && code.code === hashedCode
        );
        if (!matchingCode) {
          throwError('Invalid backup code', HttpStatus.BAD_REQUEST, 'invalidBackupCode');
        }
        break;
      }

      case 'email_otp': {
        const isValidEmailOtp = await this.mfaRepository.verifyEmailOtp(data.session_token, data.code);
        if (!isValidEmailOtp) {
          throwError('Invalid email OTP code', HttpStatus.BAD_REQUEST, 'invalidEmailOtpCode');
        }
        break;
      }

      default:
        throwError('Invalid verification method', HttpStatus.BAD_REQUEST, 'invalidVerificationMethod');
    }

    return { validatedData: data, session, user };
  }

  // RECOVERY VALIDATION

  async validateRecoveryInitiate(data: RecoveryInitiateDto): Promise<RecoveryInitiateDto> {
    const schema = Joi.object({
      email: Joi.string()
        .email({ tlds: { allow: false } })
        .required()
        .messages({
          'string.email': 'Please provide a valid email address',
          'any.required': 'Email is required',
      }),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    return data;
  }

  async validateRecoveryVerify(data: RecoveryVerifyDto): Promise<RecoveryVerifyDto> {
    const schema = Joi.object({
      token: Joi.string().required().messages({
        'any.required': 'Recovery token is required',
      }),
      new_password: Joi.string()
        .min(config.validation.password.minLength)
        .max(config.validation.password.maxLength)
        .pattern(config.validation.password.pattern)
        .required()
        .messages({
          'string.min': `Password must be at least ${config.validation.password.minLength} characters long`,
          'string.max': `Password must not exceed ${config.validation.password.maxLength} characters`,
          'string.pattern.base': config.validation.password.patternMessage,
          'any.required': 'New password is required',
        }),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    return data;
  }

  // SETTINGS & ACTIVITY VALIDATION

  async validateTwoFactorSettings(userId: number, data: TwoFactorSettingsDto): Promise<{ validatedData: TwoFactorSettingsDto; user: UserEntity }> {
    const schema = Joi.object({
      totp_enabled: Joi.boolean().optional(),
      backup_codes_enabled: Joi.boolean().optional(),
      email_otp_enabled: Joi.boolean().optional(),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    // Get user and validate
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throwError('User not found', HttpStatus.NOT_FOUND, 'userNotFound');
    }

    return { validatedData: data, user: user as UserEntity };
  }

  async validateGetTwoFactorActivity(userId: number): Promise<UserEntity> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throwError('User not found', HttpStatus.NOT_FOUND, 'userNotFound');
    }
    return user as UserEntity;
  }

  // UTILITY VALIDATION METHODS

  async validateMfaSession(sessionToken: string): Promise<{ mfaSession: any; user: UserEntity }> {
    // Validate session token format
    if (!sessionToken || sessionToken.length < 32) {
      throwError('Invalid session token', HttpStatus.UNAUTHORIZED, 'invalidSessionToken');
    }

    // Get MFA session
    const mfaSession = await this.mfaRepository.findMfaSessionByToken(sessionToken);
    if (!mfaSession) {
      throwError('Invalid session token', HttpStatus.UNAUTHORIZED, 'invalidSessionToken');
    }

    // Check if session is expired
    if (mfaSession.expiresAt < new Date()) {
      throwError('Session token has expired', HttpStatus.UNAUTHORIZED, 'expiredSessionToken');
    }

    // Get user
    const user = await this.userRepository.findById(mfaSession.userId);
    if (!user) {
      throwError('User not found', HttpStatus.NOT_FOUND, 'userNotFound');
    }

    return { mfaSession, user: user as UserEntity };
  }

  async validateUserExistsByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.userRepository.findByEmail(email);
    return user as UserEntity | null;
  }

  async validateRateLimitResult(rateLimitResult: any): Promise<void> {
    if (rateLimitResult && rateLimitResult.blocked) {
      throwError(
        `Too many attempts. Please try again in ${rateLimitResult.retryAfter} seconds`,
        HttpStatus.TOO_MANY_REQUESTS,
        'rateLimitExceeded',
      );
    }
  }
}
