import { Injectable, HttpStatus } from '@nestjs/common';
import { UserRepository } from '../../repositories/user.repository';
import { throwError } from '../../utils/util';
import { validateJoiSchema } from '../../utils/joi.validator';
import { UpdateProfileDto } from './dto/profile.dto';
import { UserEntity } from '../../repositories/entities/user.entity';
import * as Joi from 'joi';

@Injectable()
export class ProfileValidator {
  constructor(private readonly userRepository: UserRepository) {}

  async validateGetProfile(userId: number): Promise<UserEntity> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throwError('User not found', HttpStatus.NOT_FOUND, 'userNotFound');
    }

    return user as UserEntity;
  }

  async validateUpdateProfile(
    userId: number,
    data: UpdateProfileDto,
  ): Promise<{ validatedData: UpdateProfileDto; user: UserEntity }> {
    // Validate input data
    const schema = Joi.object({
      firstName: Joi.string().min(2).max(50).optional().messages({
        'string.min': 'First name must be at least 2 characters long',
        'string.max': 'First name must not exceed 50 characters',
      }),
      lastName: Joi.string().min(2).max(50).optional().messages({
        'string.min': 'Last name must be at least 2 characters long',
        'string.max': 'Last name must not exceed 50 characters',
      }),
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
}
