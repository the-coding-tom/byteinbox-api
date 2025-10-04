import { Injectable, HttpStatus } from '@nestjs/common';
import { UserRepository } from '../../../repositories/user.repository';
import { ProfileValidator } from './profile.validator';
import { generateSuccessResponse } from '../../../utils/util';
import { handleServiceError } from '../../../utils/error.util';
import { UpdateProfileDto } from './dto/profile.dto';

@Injectable()
export class ProfileService {
  constructor(
    private userRepository: UserRepository,
    private profileValidator: ProfileValidator,
  ) {}

  async getProfile(userId: number): Promise<any> {
    try {
      // Validate user and get profile data
      const user = await this.profileValidator.validateGetProfile(userId);

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'Profile retrieved successfully',
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isEmailVerified: user.isEmailVerified,
          status: user.status,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    } catch (error) {
      return handleServiceError('Error retrieving profile', error);
    }
  }

  async updateProfile(userId: number, updateProfileDto: UpdateProfileDto): Promise<any> {
    try {
      // Validate user and update data
      const { validatedData, user } = await this.profileValidator.validateUpdateProfile(
        userId,
        updateProfileDto,
      );

      // Update user profile
      await this.userRepository.update(userId, {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
      });

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'Profile updated successfully',
        data: {
          id: user.id,
          email: user.email,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,

          isEmailVerified: user.isEmailVerified,
          status: user.status,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      return handleServiceError('Error updating profile', error);
    }
  }
}
