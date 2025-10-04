import { Injectable, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserStatus } from '@prisma/client';
import { UserRepository } from '../../../repositories/user.repository';

import { validateJoiSchema } from '../../../utils/joi.validator';
import { throwError } from '../../../utils/util';
import { config } from '../../../config/config';
import { validatePassword } from '../../../utils/authentication.util';
import {
  RegisterDto,
  LoginDto,
  OAuthLoginDto,
  RefreshTokenDto,
  VerifyEmailDto,
  ResendVerificationDto,
  OAuthCallbackDto,
} from './dto/core-auth.dto';
import { UserEntity } from '../../../repositories/entities/user.entity';
import * as Joi from 'joi';

@Injectable()
export class CoreAuthValidator {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  // USER REGISTRATION VALIDATION

  async validateRegister(data: RegisterDto): Promise<RegisterDto> {
    // Validate input schema
    const schema = Joi.object({
      email: Joi.string()
        .email({ tlds: { allow: false } })
        .required()
        .messages({
          'string.email': 'Please provide a valid email address',
          'any.required': 'Email is required',
        }),
      password: Joi.string()
        .min(config.validation.password.minLength)
        .max(config.validation.password.maxLength)
        .pattern(config.validation.password.pattern)
        .required()
        .messages({
          'string.min': `Password must be at least ${config.validation.password.minLength} characters long`,
          'string.max': `Password must not exceed ${config.validation.password.maxLength} characters`,
          'string.pattern.base': config.validation.password.patternMessage,
          'any.required': 'Password is required',
        }),
      firstName: Joi.string()
        .min(config.validation.name.minLength)
        .max(50)
        .required()
        .messages({
          'string.min': `First name must be at least ${config.validation.name.minLength} characters long`,
          'string.max': 'First name must not exceed 50 characters',
          'any.required': 'First name is required',
        }),
      lastName: Joi.string()
        .min(config.validation.name.minLength)
        .max(50)
        .optional()
        .messages({
          'string.min': `Last name must be at least ${config.validation.name.minLength} characters long`,
          'string.max': 'Last name must not exceed 50 characters',
        }),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throwError('User with this email already exists', HttpStatus.CONFLICT, 'userAlreadyExists');
    }

    return data;
  }

  // AUTHENTICATION VALIDATION

  async validateLogin(data: LoginDto): Promise<{ validatedData: LoginDto; user: UserEntity }> {
    // Validate input schema
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

    // Find user by email
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      throwError('Invalid email or password', HttpStatus.UNAUTHORIZED, 'invalidCredentials');
    }

    // Validate password
    const isPasswordValid = await validatePassword(data.password, user.password);
    if (!isPasswordValid) {
      throwError('Invalid email or password', HttpStatus.UNAUTHORIZED, 'invalidCredentials');
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      throwError(
        'Please verify your email before logging in',
        HttpStatus.FORBIDDEN,
        'emailNotVerified',
      );
    }

    // Check if user status is active
    if (user.status !== UserStatus.ACTIVE) {
      throwError(
        'Account is not active. Please contact support.',
        HttpStatus.FORBIDDEN,
        'accountInactive',
      );
    }

    return { validatedData: data, user: user as UserEntity };
  }

  async validateOAuthLogin(data: OAuthLoginDto): Promise<OAuthLoginDto> {
    // Validate input schema
    const schema = Joi.object({
      provider: Joi.string().valid('google', 'github', 'microsoft').required().messages({
        'any.only': 'Provider must be one of: google, github, microsoft',
        'any.required': 'Provider is required',
      }),
      code: Joi.string().required().messages({
        'any.required': 'Authorization code is required',
      }),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    return data;
  }

  async validateRefreshToken(data: RefreshTokenDto): Promise<RefreshTokenDto> {
    // Validate input schema
    const schema = Joi.object({
      refreshToken: Joi.string().required().messages({
        'any.required': 'Refresh token is required',
      }),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    return data;
  }

  async validateRefreshTokenForRefresh(
    data: RefreshTokenDto,
  ): Promise<{ userId: number; user: UserEntity }> {
    // Validate refresh token format
    const schema = Joi.object({
      refreshToken: Joi.string().required().messages({
        'any.required': 'Refresh token is required',
      }),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    // Verify refresh token
    let payload;
    try {
      payload = this.jwtService.verify(data.refreshToken);
    } catch (_error) {
      throwError('Invalid refresh token', HttpStatus.UNAUTHORIZED, 'invalidRefreshToken');
    }

    // Note: Token blacklisting would need to be implemented separately
    // For now, we'll skip this check as the BlacklistType doesn't include TOKEN

    // Find user
    const user = await this.userRepository.findById(payload.userId);
    if (!user) {
      throwError('User not found', HttpStatus.NOT_FOUND, 'userNotFound');
    }

    // Check if user is active
    if (user.status !== UserStatus.ACTIVE) {
      throwError('Account is not active', HttpStatus.FORBIDDEN, 'accountInactive');
    }

    return { userId: user.id, user: user as UserEntity };
  }

  // EMAIL VERIFICATION VALIDATION

  async validateVerifyEmail(
    data: VerifyEmailDto,
  ): Promise<{ validatedData: VerifyEmailDto; user: UserEntity }> {
    // Validate input schema
    const schema = Joi.object({
      token: Joi.string().required().messages({
        'any.required': 'Verification token is required',
      }),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    // Find user by verification token
    const user = await this.userRepository.findByEmailVerificationToken(data.token);
    if (!user) {
      throwError('Invalid verification token', HttpStatus.BAD_REQUEST, 'invalidVerificationToken');
    }

    // Check if token is expired
    if (user.emailVerificationExpiresAt && user.emailVerificationExpiresAt < new Date()) {
      throwError(
        'Verification token has expired',
        HttpStatus.BAD_REQUEST,
        'verificationTokenExpired',
      );
    }

    // Check if email is already verified
    if (user.emailVerified) {
      throwError('Email is already verified', HttpStatus.BAD_REQUEST, 'emailAlreadyVerified');
    }

    return { validatedData: data, user: user as UserEntity };
  }

  async validateResendVerification(
    data: ResendVerificationDto,
  ): Promise<{ validatedData: ResendVerificationDto; user: UserEntity }> {
    // Validate input schema
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

    // Find user by email
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      throwError('User not found', HttpStatus.NOT_FOUND, 'userNotFound');
    }

    // Check if user is active
    if (user.status !== UserStatus.ACTIVE) {
      throwError('Account is not active', HttpStatus.FORBIDDEN, 'accountInactive');
    }

    // Check if email is already verified
    if (user.isEmailVerified) {
      throwError('Email is already verified', HttpStatus.BAD_REQUEST, 'emailAlreadyVerified');
    }

    return { validatedData: data, user: user as UserEntity };
  }

  // OAUTH VALIDATION

  async validateOAuthCallback(query: OAuthCallbackDto): Promise<OAuthCallbackDto> {
    // Validate input schema
    const schema = Joi.object({
      code: Joi.string().required().messages({
        'any.required': 'Authorization code is required',
      }),
      state: Joi.string().optional(),
      error: Joi.string().optional(),
    });

    const error = validateJoiSchema(schema, query);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    return query;
  }

  // SESSION MANAGEMENT VALIDATION

  async validateLogout(userId: number): Promise<UserEntity> {
    // Find user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throwError('User not found', HttpStatus.NOT_FOUND, 'userNotFound');
    }

    return user as UserEntity;
  }

  // ACCOUNT MANAGEMENT VALIDATION

  async validateEmailOtpSend(data: {
    session_token: string;
    reason: string;
  }): Promise<{ session_token: string; reason: string }> {
    // Validate input schema
    const schema = Joi.object({
      session_token: Joi.string().required().messages({
        'any.required': 'Session token is required',
      }),
      reason: Joi.string().valid('login', 'recovery').required().messages({
        'any.only': 'Reason must be either login or recovery',
        'any.required': 'Reason is required',
      }),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    return data;
  }
}
