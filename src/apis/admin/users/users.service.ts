import { Injectable, HttpStatus } from '@nestjs/common';
import { UserRepository } from '../../../repositories/user.repository';
import { SessionRepository } from '../../../repositories/session.repository';
import { AdminUsersValidator } from './users.validator';
import { generateSuccessResponse, transformToPaginationMeta } from '../../../utils/util';
import { handleServiceError } from '../../../utils/error.util';
import { CreateUserByAdminDto, UpdateUserByAdminDto, AdminUserFilterDto } from './dto/users.dto';
import { Constants } from '../../../common/enums/generic.enum';
import { config } from '../../../config/config';

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly adminUsersValidator: AdminUsersValidator,
  ) {}


  async createUserByAdmin(createUserDto: CreateUserByAdminDto): Promise<{ status: number; message: string; data: any }> {
    try {
      const validatedData = await this.adminUsersValidator.validateCreateUserByAdmin(createUserDto);
      
      const userData: any = {
        email: validatedData.email,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        phoneNumber: validatedData.phoneNumber,
        userType: validatedData.userType || 'user',
        status: validatedData.status || 'PENDING',
        isEmailVerified: validatedData.isEmailVerified || false,
      };

      if (validatedData.password) {
        // userData.password = await hashPassword(validatedData.password);
      }

      if (!validatedData.isEmailVerified) {
        // userData.emailVerificationToken = uuidv4();
        // userData.emailVerificationExpiresAt = new Date(Date.now() + MILLISECONDS_IN_DAY);
      }

      // Generate unique team slug
      const teamData = await import('../../../utils/team.util').then(m => m.generateUniqueTeamSlug(userData.email));
      
      // Combine userData with teamData for single parameter
      const combinedData = {
        ...userData,
        teamName: teamData.name,
        teamSlug: teamData.slug,
      };
      
      const result = await this.userRepository.createLocalAuthUserAndPersonalTeam(combinedData);

      const { user } = result;

      // Always trigger user-created notification for welcome email
      // await this.notificationQueue.add('user-created', { userId: user.id, email: user.email });

      return generateSuccessResponse({
        statusCode: HttpStatus.CREATED,
        message: Constants.createdSuccessfully,
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber,
          status: user.status,
          isEmailVerified: user.isEmailVerified,
          lastLoginAt: (await this.sessionRepository.getLatestSessionByUserId(user.id))?.createdAt || null,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    } catch (error) {
      return handleServiceError('Error creating user', error);
    }
  }

  async getUsers(filter: AdminUserFilterDto): Promise<{ status: number; message: string; data: any }> {
    try {
      const validatedFilter = await this.adminUsersValidator.validateAdminUserFilter(filter);
      
      // Use the repository's findWithPagination method
      const result = await this.userRepository.findWithPagination({
        offset: validatedFilter.offset || 0,
        limit: validatedFilter.limit || config.validation.pagination.defaultLimit,
        keyword: validatedFilter.keyword,
        status: validatedFilter.status,
      });
      
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.retrievedSuccessfully,
        data: {
          data: await Promise.all(result.data.map(async (user: any) => ({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phoneNumber: user.phoneNumber,
            status: user.status,
            isEmailVerified: user.isEmailVerified,
            lastLoginAt: (await this.sessionRepository.getLatestSessionByUserId(user.id))?.createdAt || null,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          }))),
          meta: transformToPaginationMeta({ limit: result.limit, offset: result.offset, total: result.total }),
        },
      });
    } catch (error) {
      return handleServiceError('Error retrieving users', error);
    }
  }

  async getUserById(id: string): Promise<{ status: number; message: string; data: any }> {
    try {
      const userId = await this.adminUsersValidator.validateUserByIdString(id);
      const user = await this.userRepository.findById(userId);

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.retrievedSuccessfully,
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber,
          status: user.status,
          isEmailVerified: user.isEmailVerified,
          lastLoginAt: (await this.sessionRepository.getLatestSessionByUserId(user.id))?.createdAt || null,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    } catch (error) {
      return handleServiceError('Error retrieving user', error);
    }
  }

  async updateUserByAdmin(updateUserDto: UpdateUserByAdminDto): Promise<{ status: number; message: string; data: any }> {
    try {
      const validatedData = await this.adminUsersValidator.validateUpdateUserByAdmin(updateUserDto);
      
      // Use the repository's update method with the validated data
      const updatedUser = await this.userRepository.update(validatedData.id, validatedData);

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.updatedSuccessfully,
        data: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          phoneNumber: updatedUser.phoneNumber,
          status: updatedUser.status,
          isEmailVerified: updatedUser.isEmailVerified,
          lastLoginAt: updatedUser.lastLoginAt,
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt,
        },
      });
    } catch (error) {
      return handleServiceError('Error updating user', error);
    }
  }

  async deleteUser(id: string): Promise<{ status: number; message: string }> {
    try {
      const userId = await this.adminUsersValidator.validateUserByIdString(id);

      await this.userRepository.delete(userId);
      // await this.notificationQueue.add('account-deleted', { userId });

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.deletedSuccessfully,
      });
    } catch (error) {
      return handleServiceError('Error deleting user', error);
    }
  }

  async deactivateUserAccount(deactivateDto: any): Promise<{ status: number; message: string }> {
    try {
      const { user } = await this.adminUsersValidator.validateDeactivateUserAccount(deactivateDto);

      const updatedUser = { ...user, status: 'SUSPENDED' }; // Assuming 'SUSPENDED' is the status for deactivated account
      await this.userRepository.update(updatedUser.id, updatedUser);
      
      // await this.notificationQueue.add('account-deactivated', {
      //   userId: user.id,
      //   email: user.email,
      // });

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.updatedSuccessfully,
      });
    } catch (error) {
      return handleServiceError('Error deactivating user account', error);
    }
  }

  async deleteUserAccount(deleteDto: any): Promise<{ status: number; message: string }> {
    try {
      const { user } = await this.adminUsersValidator.validateDeleteUserAccount(deleteDto);

      await this.userRepository.delete(user.id);
      // await this.notificationQueue.add('account-deleted', {
      //   userId: user.id,
      //   email: user.email,
      // });

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.deletedSuccessfully,
      });
    } catch (error) {
      return handleServiceError('Error deleting user account', error);
    }
  }
} 