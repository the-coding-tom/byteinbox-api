import { Injectable } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import * as Joi from 'joi';

import { AuthRepository } from '../../repositories/auth.repository';
import { UserEntity } from '../../repositories/entities/user.entity';
import { validateJoiSchema } from '../../utils/joi.validator';
import { throwError } from '../../utils/util';
import { AuthenticationHelper } from '../../helpers/authentication';

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

@Injectable()
export class AuthValidator {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly authHelper: AuthenticationHelper,
  ) {}

  // ============================================================================
  // AUTHENTICATION VALIDATION METHODS
  // ============================================================================

  async validateRegister(data: RegisterDto): Promise<RegisterDto> {
    const schema = Joi.object({
      email: Joi.string()
        .email({ tlds: { allow: false } })
        .required()
        .messages({
          'string.email': 'Please provide a valid email address',
          'any.required': 'Email is required',
        }),
      password: Joi.string()
        .min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .required()
        .messages({
          'string.min': 'Password must be at least 8 characters long',
          'string.pattern.base':
            'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
          'any.required': 'Password is required',
        }),
      firstName: Joi.string().min(2).max(50).optional().messages({
        'string.min': 'First name must be at least 2 characters long',
        'string.max': 'First name must not exceed 50 characters',
      }),
      lastName: Joi.string().min(2).max(50).optional().messages({
        'string.min': 'Last name must be at least 2 characters long',
        'string.max': 'Last name must not exceed 50 characters',
      }),
      phoneNumber: Joi.string()
        .pattern(/^\+?[1-9]\d{1,14}$/)
        .optional()
        .messages({
          'string.pattern.base': 'Please provide a valid phone number',
        }),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    // Check if user already exists
    const existingUser = await this.authRepository.findUserByEmail(data.email);
    if (existingUser) {
      throwError('User with this email already exists', HttpStatus.CONFLICT, 'userAlreadyExists');
    }

    return data;
  }

  async validateLogin(data: LoginDto): Promise<LoginDto> {
    const schema = Joi.object({
      email: Joi.string()
        .email({ tlds: { allow: false } })
        .required()
        .messages({
          'string.email': 'Please provide a valid email address',
          'any.required': 'Email is required',
        }),
      password: Joi.string().required().messages({
        'any.required': 'Password is required',
      }),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    return data;
  }

  async validateOAuthLogin(data: OAuthLoginDto): Promise<OAuthLoginDto> {
    const schema = Joi.object({
      provider: Joi.string().valid('google', 'facebook', 'github', 'linkedin').required().messages({
        'any.only': 'Provider must be one of: google, facebook, github, linkedin',
        'any.required': 'Provider is required',
      }),
      code: Joi.string().optional().messages({
        'string.base': 'Authorization code must be a string',
      }),
      accessToken: Joi.string().optional().messages({
        'string.base': 'Access token must be a string',
      }),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    return data;
  }

  async validateRefreshToken(data: RefreshTokenDto): Promise<RefreshTokenDto> {
    const schema = Joi.object({
      refreshToken: Joi.string().required().messages({
        'any.required': 'Refresh token is required',
      }),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    return data;
  }

  async validateOAuthCallback(
    data: any,
  ): Promise<any> {
    const schema = Joi.object({
      code: Joi.string().optional().messages({
        'string.base': 'Authorization code must be a string',
      }),
      error: Joi.string().optional().messages({
        'string.base': 'Error must be a string',
      }),
      state: Joi.string().optional().messages({
        'string.base': 'State must be a string',
      }),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    return data;
  }

  // ============================================================================
  // EMAIL VERIFICATION VALIDATION METHODS
  // ============================================================================

  async validateVerifyEmail(data: VerifyEmailDto): Promise<VerifyEmailDto> {
    const schema = Joi.object({
      token: Joi.string().required().messages({
        'any.required': 'Verification token is required',
      }),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    return data;
  }

  async validateResendVerification(data: ResendVerificationDto): Promise<ResendVerificationDto> {
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

    // Check if user exists
    const existingUser = await this.authRepository.findUserByEmail(data.email);
    if (!existingUser) {
      throwError('User not found', HttpStatus.NOT_FOUND, 'userNotFound');
    }

    return data;
  }

  // ============================================================================
  // PASSWORD MANAGEMENT VALIDATION METHODS
  // ============================================================================

  async validateForgotPassword(data: ForgotPasswordDto): Promise<ForgotPasswordDto> {
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

    // Note: We don't check if user exists here for security reasons
    // This prevents email enumeration attacks
    return data;
  }

  async validateResetPassword(data: ResetPasswordDto): Promise<ResetPasswordDto> {
    const schema = Joi.object({
      token: Joi.string().required().messages({
        'any.required': 'Reset token is required',
      }),
      password: Joi.string()
        .min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .required()
        .messages({
          'string.min': 'Password must be at least 8 characters long',
          'string.pattern.base':
            'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
          'any.required': 'Password is required',
        }),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    return data;
  }

  async validateChangePassword(data: ChangePasswordDto): Promise<ChangePasswordDto> {
    const schema = Joi.object({
      currentPassword: Joi.string().required().messages({
        'any.required': 'Current password is required',
      }),
      newPassword: Joi.string()
        .min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .required()
        .messages({
          'string.min': 'Password must be at least 8 characters long',
          'string.pattern.base':
            'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
          'any.required': 'New password is required',
        }),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    return data;
  }

  // ============================================================================
  // MFA VALIDATION METHODS
  // ============================================================================

  async validateSetupMfa(data: SetupMfaDto): Promise<SetupMfaDto> {
    const schema = Joi.object({
      method: Joi.string().valid('totp', 'email', 'sms').required().messages({
        'any.only': 'MFA method must be one of: totp, email, sms',
        'any.required': 'MFA method is required',
      }),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    return data;
  }

  async validateEnableMfa(data: EnableMfaDto): Promise<EnableMfaDto> {
    const schema = Joi.object({
      code: Joi.string().required().messages({
        'any.required': 'Verification code is required',
      }),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    return data;
  }

  async validateDisableMfa(data: DisableMfaDto): Promise<DisableMfaDto> {
    const schema = Joi.object({
      code: Joi.string().required().messages({
        'any.required': 'Verification code is required',
      }),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    return data;
  }

  async validateVerifyMfa(data: VerifyMfaDto): Promise<VerifyMfaDto> {
    const schema = Joi.object({
      code: Joi.string().required().messages({
        'any.required': 'Verification code is required',
      }),
      method: Joi.string().valid('email', 'sms', 'totp').required().messages({
        'any.only': 'MFA method must be one of: email, sms, totp',
        'any.required': 'MFA method is required',
      }),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    return data;
  }

  async validateSendOtp(data: SendOtpDto): Promise<SendOtpDto> {
    const schema = Joi.object({
      method: Joi.string().valid('email', 'sms').required().messages({
        'any.only': 'OTP method must be one of: email, sms',
        'any.required': 'OTP method is required',
      }),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    return data;
  }

  // ============================================================================
  // OTP VERIFICATION VALIDATION METHODS
  // ============================================================================

  async validateVerifyEmailOtp(data: {
    email: string;
    otp: string;
  }): Promise<{ email: string; otp: string }> {
    const schema = Joi.object({
      email: Joi.string()
        .email({ tlds: { allow: false } })
        .required()
        .messages({
          'string.email': 'Please provide a valid email address',
          'any.required': 'Email is required',
        }),
      otp: Joi.string().required().messages({
        'any.required': 'OTP code is required',
      }),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    return data;
  }

  async validateVerifySmsOtp(data: {
    phoneNumber: string;
    otp: string;
  }): Promise<{ phoneNumber: string; otp: string }> {
    const schema = Joi.object({
      phoneNumber: Joi.string()
        .pattern(/^\+?[1-9]\d{1,14}$/)
        .required()
        .messages({
          'string.pattern.base': 'Please provide a valid phone number',
          'any.required': 'Phone number is required',
        }),
      otp: Joi.string().required().messages({
        'any.required': 'OTP code is required',
      }),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    return data;
  }

  async validateVerifyTotp(data: { code: string }): Promise<{ code: string }> {
    const schema = Joi.object({
      code: Joi.string().required().messages({
        'any.required': 'TOTP code is required',
      }),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    return data;
  }

  // ============================================================================
  // USER PROFILE VALIDATION METHODS
  // ============================================================================

  async validateGetProfile(userId: number): Promise<number> {
    const schema = Joi.object({
      userId: Joi.number().required().positive().messages({
        'any.required': 'User ID is required',
        'number.positive': 'User ID must be positive',
      }),
    });

    const error = validateJoiSchema(schema, { userId });
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    return userId;
  }

  async validateUpdateProfile(data: UpdateUserProfileDto): Promise<UpdateUserProfileDto> {
    const schema = Joi.object({
      firstName: Joi.string().min(2).max(50).optional().messages({
        'string.min': 'First name must be at least 2 characters long',
        'string.max': 'First name must not exceed 50 characters',
      }),
      lastName: Joi.string().min(2).max(50).optional().messages({
        'string.min': 'Last name must be at least 2 characters long',
        'string.max': 'Last name must not exceed 50 characters',
      }),
      phoneNumber: Joi.string()
        .pattern(/^\+?[1-9]\d{1,14}$/)
        .optional()
        .messages({
          'string.pattern.base': 'Please provide a valid phone number',
        }),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    return data;
  }

  // ============================================================================
  // ACCOUNT MANAGEMENT VALIDATION METHODS
  // ============================================================================

  async validateDeactivateAccount(userId: number): Promise<number> {
    const schema = Joi.object({
      userId: Joi.number().required().positive().messages({
        'any.required': 'User ID is required',
        'number.positive': 'User ID must be positive',
      }),
    });

    const error = validateJoiSchema(schema, { userId });
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    return userId;
  }

  async validateDeleteAccount(data: {
    userId: number;
    password: string;
  }): Promise<{ userId: number; password: string }> {
    const schema = Joi.object({
      userId: Joi.number().required().positive().messages({
        'any.required': 'User ID is required',
        'number.positive': 'User ID must be positive',
      }),
      password: Joi.string().required().messages({
        'any.required': 'Password is required',
      }),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    return data;
  }

  async validateUnlockAccount(userId: number): Promise<number> {
    const schema = Joi.object({
      userId: Joi.number().required().positive().messages({
        'any.required': 'User ID is required',
        'number.positive': 'User ID must be positive',
      }),
    });

    const error = validateJoiSchema(schema, { userId });
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    return userId;
  }

  // ============================================================================
  // SESSION MANAGEMENT VALIDATION METHODS
  // ============================================================================

  async validateGetActiveSessions(userId: number): Promise<number> {
    const schema = Joi.object({
      userId: Joi.number().required().positive().messages({
        'any.required': 'User ID is required',
        'number.positive': 'User ID must be positive',
      }),
    });

    const error = validateJoiSchema(schema, { userId });
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    return userId;
  }

  async validateRevokeAllSessions(userId: number): Promise<number> {
    const schema = Joi.object({
      userId: Joi.number().required().positive().messages({
        'any.required': 'User ID is required',
        'number.positive': 'User ID must be positive',
      }),
    });

    const error = validateJoiSchema(schema, { userId });
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    return userId;
  }

  // ============================================================================
  // SECURITY & ADMIN VALIDATION METHODS
  // ============================================================================

  async validateGetSecurityActivity(userId: number): Promise<number> {
    const schema = Joi.object({
      userId: Joi.number().required().positive().messages({
        'any.required': 'User ID is required',
        'number.positive': 'User ID must be positive',
      }),
    });

    const error = validateJoiSchema(schema, { userId });
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    return userId;
  }

  async validateResetUserMfa(userId: number): Promise<number> {
    const schema = Joi.object({
      userId: Joi.number().required().positive().messages({
        'any.required': 'User ID is required',
        'number.positive': 'User ID must be positive',
      }),
    });

    const error = validateJoiSchema(schema, { userId });
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    return userId;
  }

  // ============================================================================
  // BUSINESS LOGIC VALIDATION METHODS
  // ============================================================================

  async validateUserCredentials(email: string, password: string): Promise<UserEntity> {
    const user = await this.authRepository.findUserByEmail(email);
    if (!user) {
      throwError('Invalid email or password', HttpStatus.UNAUTHORIZED, 'invalidCredentials');
    }
    
    const validatedUser = user as UserEntity;
    if (!validatedUser.password) {
      throwError('Invalid email or password', HttpStatus.UNAUTHORIZED, 'invalidCredentials');
    }

    const isPasswordValid = await this.authHelper.validatePassword(password, validatedUser.password as string);
    if (!isPasswordValid) {
      throwError('Invalid email or password', HttpStatus.UNAUTHORIZED, 'invalidCredentials');
    }

    return validatedUser;
  }

  checkUserLoginEligibility(user: UserEntity): void {
    if (!user.isEmailVerified) {
      throwError(
        'Please verify your email before logging in',
        HttpStatus.UNAUTHORIZED,
        'emailNotVerified',
      );
    }

    if (!user.isActive) {
      throwError('Account is deactivated', HttpStatus.UNAUTHORIZED, 'accountDeactivated');
    }
  }

  async validatePasswordChange(user: UserEntity, currentPassword: string): Promise<void> {
    if (!user.password) {
      throwError(
        'Cannot change password for OAuth users',
        HttpStatus.BAD_REQUEST,
        'oauthUserPasswordChange',
      );
    }

    if (user.password == null) {
      throwError('Password is missing', HttpStatus.BAD_REQUEST, 'missingPassword');
    }

    const isCurrentPasswordValid = await this.authHelper.validatePassword(
      currentPassword,
      user.password as string,
    );
    if (!isCurrentPasswordValid) {
      throwError('Current password is incorrect', HttpStatus.BAD_REQUEST, 'incorrectCurrentPassword');
    }
  }

  async getUserByIdOrFail(userId: number): Promise<UserEntity> {
    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      throwError('User not found', HttpStatus.NOT_FOUND, 'userNotFound');
    }
    return user as UserEntity;
  }
}
