import { Injectable, HttpStatus } from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { UserRepository } from '../../../repositories/user.repository';
import { validateJoiSchema } from '../../../utils/joi.validator';
import { throwError } from '../../../utils/util';
import { config } from '../../../config/config';
import { UserEntity } from '../../../repositories/entities/user.entity';
import * as Joi from 'joi';
import {
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
} from './dto/password.dto';

@Injectable()
export class PasswordValidator {
  constructor(
    private readonly userRepository: UserRepository,

  ) {}

  async validateForgotPassword(data: ForgotPasswordDto): Promise<{ validatedData: ForgotPasswordDto; user: UserEntity }> {
    // Validate input schema
    const schema = Joi.object({
      email: Joi.string()
        .email()
        .required()
        .messages({
          'string.email': 'Please provide a valid email address',
          'any.required': 'Email is required',
        }),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    // Find user
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      throwError('User not found', HttpStatus.NOT_FOUND, 'userNotFound');
    }

    // Check if user is active
    if (user.status !== UserStatus.ACTIVE) {
      throwError('Account is not active', HttpStatus.BAD_REQUEST, 'accountNotActive');
    }

    return { validatedData: data, user: user as UserEntity };
  }

  async validateResetPassword(data: ResetPasswordDto): Promise<{ validatedData: ResetPasswordDto; user: UserEntity }> {
    // Validate input schema
    const schema = Joi.object({
      token: Joi.string()
        .required()
        .messages({
          'any.required': 'Reset token is required',
        }),
      password: Joi.string()
        .min(config.validation.password.minLength)
        .max(config.validation.password.maxLength)
        .pattern(config.validation.password.pattern)
        .required()
        .messages({
          'string.min': `Password must be at least ${config.validation.password.minLength} characters long`,
          'string.max': `Password must not exceed ${config.validation.password.maxLength} characters`,
          'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
          'any.required': 'Password is required',
        }),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    // Find user by reset token
    const user = await this.userRepository.findByPasswordResetToken(data.token);
    if (!user) {
      throwError('Invalid or expired reset token', HttpStatus.BAD_REQUEST, 'invalidResetToken');
    }

    // Check if token is expired
    if (user.passwordResetExpiresAt && user.passwordResetExpiresAt < new Date()) {
      throwError('Reset token has expired', HttpStatus.BAD_REQUEST, 'resetTokenExpired');
    }

    // Check if user is active
    if (user.status !== UserStatus.ACTIVE) {
      throwError('Account is not active', HttpStatus.BAD_REQUEST, 'accountNotActive');
    }

    return { validatedData: data, user: user as UserEntity };
  }

  async validateChangePassword(
    userId: number,
    data: ChangePasswordDto,
  ): Promise<{ validatedData: ChangePasswordDto; user: UserEntity }> {
    // Validate input schema
    const schema = Joi.object({
      currentPassword: Joi.string()
        .required()
        .messages({
          'any.required': 'Current password is required',
        }),
      newPassword: Joi.string()
        .min(config.validation.password.minLength)
        .max(config.validation.password.maxLength)
        .pattern(config.validation.password.pattern)
        .required()
        .messages({
          'string.min': `Password must be at least ${config.validation.password.minLength} characters long`,
          'string.max': `Password must not exceed ${config.validation.password.maxLength} characters`,
          'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
          'any.required': 'New password is required',
        }),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    // Find user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throwError('User not found', HttpStatus.NOT_FOUND, 'userNotFound');
    }

    // Check if user is active
    if (user.status !== UserStatus.ACTIVE) {
      throwError('Account is not active', HttpStatus.BAD_REQUEST, 'accountNotActive');
    }

    // Verify current password
    const bcrypt = require('bcryptjs');
    const isCurrentPasswordValid = await bcrypt.compare(data.currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throwError('Current password is incorrect', HttpStatus.BAD_REQUEST, 'incorrectCurrentPassword');
    }

    // Check if new password is different from current
    const isNewPasswordSame = await bcrypt.compare(data.newPassword, user.password);
    if (isNewPasswordSame) {
      throwError('New password must be different from current password', HttpStatus.BAD_REQUEST, 'newPasswordSameAsCurrent');
    }

    return { validatedData: data, user: user as UserEntity };
  }
} 