import { Injectable, HttpStatus } from '@nestjs/common';
import * as Joi from 'joi';

import {
  VALIDATION_MESSAGES,
  USER_STATUS_VALUES,
} from '../../common/constants/validation.constant';
import { config } from '../../config/config';
import { UserRepository } from '../../repositories/user.repository';
import { validateJoiSchema } from '../../utils/joi.validator';
import { throwError } from '../../utils/util';

import { CreateUserDto, UpdateUserDto, UserFilterDto } from './dto/users.dto';

@Injectable()
export class UsersValidator {
  constructor(private readonly userRepository: UserRepository) {}

  async validateCreateRequest(params: CreateUserDto): Promise<any> {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(config.validation.password.minLength).required(),
      firstName: Joi.string().min(config.validation.name.minLength).optional(),
      lastName: Joi.string().min(config.validation.name.minLength).optional(),
    });

    const error = validateJoiSchema(schema, params);
    if (error) throwError(error, HttpStatus.BAD_REQUEST);

    // Additional business validation logic
    const existingUser = await this.userRepository.findByEmail(params.email);
    if (existingUser) {
      throwError(VALIDATION_MESSAGES.USER_ALREADY_EXISTS, HttpStatus.CONFLICT);
    }

    return params;
  }

  async validateUpdateRequest(params: UpdateUserDto): Promise<any> {
    const schema = Joi.object({
      id: Joi.number().positive().required(),
      email: Joi.string().email().optional(),
      firstName: Joi.string().min(config.validation.name.minLength).optional(),
      lastName: Joi.string().min(config.validation.name.minLength).optional(),
      isActive: Joi.boolean().optional(),
    });

    const error = validateJoiSchema(schema, params);
    if (error) throwError(error, HttpStatus.BAD_REQUEST);

    // Check if user exists
    const existingUser = await this.userRepository.findById(params.id);
    if (!existingUser) {
      throwError(VALIDATION_MESSAGES.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    // Check email uniqueness if email is being updated
    if (params.email && params.email !== existingUser.email) {
      const userWithEmail = await this.userRepository.findByEmail(params.email);
      if (userWithEmail && userWithEmail.id !== params.id) {
        throwError(VALIDATION_MESSAGES.EMAIL_ALREADY_IN_USE, HttpStatus.CONFLICT);
      }
    }

    return params;
  }

  async validateGetUsersRequest(filter: UserFilterDto): Promise<any> {
    const schema = Joi.object({
      page: Joi.number()
        .min(config.validation.pagination.defaultPage)
        .default(config.validation.pagination.defaultPage),
      limit: Joi.number()
        .min(config.validation.pagination.defaultPage)
        .max(config.validation.pagination.maxLimit)
        .default(config.validation.pagination.defaultLimit),
      keyword: Joi.string().allow('').optional(),
      status: Joi.string().valid(USER_STATUS_VALUES.ACTIVE, USER_STATUS_VALUES.INACTIVE).optional(),
      startDate: Joi.string().isoDate().optional(),
      endDate: Joi.string().isoDate().optional(),
    });

    const { error, value } = schema.validate(filter);
    if (error) throwError(error.details[0].message, HttpStatus.BAD_REQUEST);

    // Convert page to offset
    const offset = (value.page - 1) * value.limit;

    return {
      ...value,
      offset,
    };
  }

  async validateGetUserByIdRequest(id: string): Promise<number> {
    const userId = parseInt(id);

    if (isNaN(userId) || userId <= 0) {
      throwError(VALIDATION_MESSAGES.INVALID_USER_ID, HttpStatus.BAD_REQUEST);
    }

    const existingUser = await this.userRepository.findById(userId);
    if (!existingUser) {
      throwError(VALIDATION_MESSAGES.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    return userId;
  }
}
