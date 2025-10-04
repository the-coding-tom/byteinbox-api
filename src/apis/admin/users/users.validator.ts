import { Injectable, HttpStatus } from '@nestjs/common';
import * as Joi from 'joi';
import { UserRepository } from '../../../repositories/user.repository';
import { throwError } from '../../../utils/util';
import { validateJoiSchema } from '../../../utils/joi.validator';
import { UserEntity } from '../../../repositories/entities/user.entity';
import {
  CreateUserByAdminDto,
  UpdateUserByAdminDto,
  AdminUserFilterDto,
  ResetUserMfaDto,
  UnlockUserAccountDto,
  DeactivateUserAccountDto,
  DeleteUserAccountDto,
} from './dto/users.dto';

@Injectable()
export class AdminUsersValidator {
  constructor(private readonly userRepository: UserRepository) {}

  async validateCreateUserByAdmin(data: CreateUserByAdminDto): Promise<CreateUserByAdminDto> {
    const schema = Joi.object({
      email: Joi.string()
        .email({ tlds: { allow: false } })
        .required()
        .messages({
          'string.email': 'Please provide a valid email address',
          'any.required': 'Email is required',
        }),
      password: Joi.string().optional().messages({
        'string.base': 'Password must be a string',
      }),
      firstName: Joi.string().max(50).optional().messages({
        'string.max': 'First name must not exceed 50 characters',
      }),
      lastName: Joi.string().max(50).optional().messages({
        'string.max': 'Last name must not exceed 50 characters',
      }),
      phoneNumber: Joi.string()
        .pattern(/^\+?[1-9]\d{1,14}$/)
        .optional()
        .messages({
          'string.pattern.base': 'Please provide a valid phone number',
        }),
      userType: Joi.string().valid('user', 'admin', 'moderator', 'support').optional().messages({
        'any.only': 'User type must be one of: user, admin, moderator, support',
      }),
      status: Joi.string().valid('active', 'inactive', 'pending', 'suspended').optional().messages({
        'any.only': 'Status must be one of: active, inactive, pending, suspended',
      }),
      isEmailVerified: Joi.boolean().optional().messages({
        'boolean.base': 'isEmailVerified must be a boolean',
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

  async validateUpdateUserByAdmin(data: UpdateUserByAdminDto): Promise<UpdateUserByAdminDto> {
    const schema = Joi.object({
      id: Joi.number().required().positive().messages({
        'any.required': 'User ID is required',
        'number.positive': 'User ID must be positive',
      }),
      email: Joi.string()
        .email({ tlds: { allow: false } })
        .optional()
        .messages({
          'string.email': 'Please provide a valid email address',
        }),
      firstName: Joi.string().max(50).optional().messages({
        'string.max': 'First name must not exceed 50 characters',
      }),
      lastName: Joi.string().max(50).optional().messages({
        'string.max': 'Last name must not exceed 50 characters',
      }),
      phoneNumber: Joi.string()
        .pattern(/^\+?[1-9]\d{1,14}$/)
        .optional()
        .messages({
          'string.pattern.base': 'Please provide a valid phone number',
        }),
      userType: Joi.string().valid('user', 'admin', 'moderator', 'support').optional().messages({
        'any.only': 'User type must be one of: user, admin, moderator, support',
      }),
      status: Joi.string().valid('active', 'inactive', 'pending', 'suspended').optional().messages({
        'any.only': 'Status must be one of: active, inactive, pending, suspended',
      }),
      isEmailVerified: Joi.boolean().optional().messages({
        'boolean.base': 'isEmailVerified must be a boolean',
      }),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    // Check if user exists
    const user = await this.userRepository.findById(data.id);
    if (!user) {
      throwError('User not found', HttpStatus.NOT_FOUND, 'userNotFound');
    }

    // If email is being updated, check if new email is already taken
    if (data.email && data.email !== user!.email) {
      const existingUserWithEmail = await this.userRepository.findByEmail(data.email);
      if (existingUserWithEmail) {
        throwError('Email already taken', HttpStatus.CONFLICT, 'emailAlreadyTaken');
      }
    }

    return data;
  }

  async validateAdminUserFilter(data: AdminUserFilterDto): Promise<AdminUserFilterDto> {
    const schema = Joi.object({
      offset: Joi.number().min(0).optional().default(0).messages({
        'number.min': 'Offset must be 0 or greater',
      }),
      limit: Joi.number().min(1).max(100).optional().default(10).messages({
        'number.min': 'Limit must be 1 or greater',
        'number.max': 'Limit must not exceed 100',
      }),
      keyword: Joi.string().max(100).optional().messages({
        'string.max': 'Keyword must not exceed 100 characters',
      }),
      status: Joi.string().valid('active', 'inactive', 'pending', 'suspended').optional().messages({
        'any.only': 'Status must be one of: active, inactive, pending, suspended',
      }),
      userType: Joi.string().valid('user', 'admin', 'moderator', 'support').optional().messages({
        'any.only': 'User type must be one of: user, admin, moderator, support',
      }),
      isEmailVerified: Joi.boolean().optional().messages({
        'boolean.base': 'isEmailVerified must be a boolean',
      }),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    return data;
  }

  async validateResetUserMfa(data: ResetUserMfaDto): Promise<{ user: UserEntity }> {
    const schema = Joi.object({
      userId: Joi.number().required().positive().messages({
        'any.required': 'User ID is required',
        'number.positive': 'User ID must be positive',
      }),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    // Check if user exists
    const user = await this.userRepository.findById(data.userId);
    if (!user) {
      throwError('User not found', HttpStatus.NOT_FOUND, 'userNotFound');
    }

    return { user: user as UserEntity };
  }

  async validateUnlockUserAccount(data: UnlockUserAccountDto): Promise<{ user: UserEntity }> {
    const schema = Joi.object({
      userId: Joi.number().required().positive().messages({
        'any.required': 'User ID is required',
        'number.positive': 'User ID must be positive',
      }),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    // Check if user exists
    const user = await this.userRepository.findById(data.userId);
    if (!user) {
      throwError('User not found', HttpStatus.NOT_FOUND, 'userNotFound');
    }

    return { user: user as UserEntity };
  }

  async validateDeactivateUserAccount(data: DeactivateUserAccountDto): Promise<{ user: UserEntity }> {
    const schema = Joi.object({
      userId: Joi.number().required().positive().messages({
        'any.required': 'User ID is required',
        'number.positive': 'User ID must be positive',
      }),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    // Check if user exists
    const user = await this.userRepository.findById(data.userId);
    if (!user) {
      throwError('User not found', HttpStatus.NOT_FOUND, 'userNotFound');
    }

    return { user: user as UserEntity };
  }

  async validateDeleteUserAccount(data: DeleteUserAccountDto): Promise<{ user: UserEntity }> {
    const schema = Joi.object({
      userId: Joi.number().required().positive().messages({
        'any.required': 'User ID is required',
        'number.positive': 'User ID must be positive',
      }),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    // Check if user exists
    const user = await this.userRepository.findById(data.userId);
    if (!user) {
      throwError('User not found', HttpStatus.NOT_FOUND, 'userNotFound');
    }

    return { user: user as UserEntity };
  }

  async validateUserByIdString(id: string): Promise<number> {
    const schema = Joi.object({
      id: Joi.string().required().pattern(/^[1-9]\d{0,8}$/).max(9).messages({
        'any.required': 'User ID is required',
        'string.pattern.base': 'User ID must be a valid positive integer',
        'string.max': 'User ID is too large',
      }),
    });

    const error = validateJoiSchema(schema, { id });
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    const userId = parseInt(id);
    
    // Check if user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throwError('User not found', HttpStatus.NOT_FOUND, 'userNotFound');
    }

    return userId;
  }
} 