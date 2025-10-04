import { Injectable, HttpStatus } from '@nestjs/common';
import { UserRepository } from '../../../repositories/user.repository';
import { AdminUsersValidator } from './users.validator';
import { generateSuccessResponse } from '../../../utils/util';
import { handleServiceError } from '../../../utils/error.util';
import { CreateUserByAdminDto, UpdateUserByAdminDto, AdminUserFilterDto } from './dto/users.dto';

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly userRepository: UserRepository,
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
        status: validatedData.status || 'PENDING', // Assuming 'PENDING' is the default status
        isEmailVerified: validatedData.isEmailVerified || false,
      };

      // Handle password if provided
      if (validatedData.password) {
        // Assuming hashPassword is available or will be added
        // userData.password = await hashPassword(validatedData.password); 
      }

      // Generate email verification token if email is not verified
      if (!validatedData.isEmailVerified) {
        // userData.emailVerificationToken = uuidv4();
        // userData.emailVerificationExpiresAt = new Date(Date.now() + MILLISECONDS_IN_DAY);
      }

      // Create user with default team in transaction
      const result = await this.userRepository.createWithDefaultTeam({
        userData,
        userEmail: validatedData.email,
      });

      const { user } = result;

      // Always trigger user-created notification for welcome email
      // await this.notificationQueue.add('user-created', { userId: user.id, email: user.email });

      return generateSuccessResponse({
        statusCode: HttpStatus.CREATED,
        message: 'User created successfully',
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber,
          status: user.status,
          isEmailVerified: user.isEmailVerified,
          lastLoginAt: user.lastLoginAt,
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
        limit: validatedFilter.limit || 10,
        keyword: validatedFilter.keyword,
        status: validatedFilter.status,
      });
      
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'Users retrieved successfully',
        data: {
          data: result.data.map((user: any) => ({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phoneNumber: user.phoneNumber,
            status: user.status,
            isEmailVerified: user.isEmailVerified,
            lastLoginAt: user.lastLoginAt,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          })),
          meta: result.meta,
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
        message: 'User retrieved successfully',
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber,
          status: user.status,
          isEmailVerified: user.isEmailVerified,
          lastLoginAt: user.lastLoginAt,
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
        message: 'User updated successfully',
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
        message: 'User deleted successfully',
      });
    } catch (error) {
      return handleServiceError('Error deleting user', error);
    }
  }

  async resetUserMfa(resetMfaDto: any): Promise<{ status: number; message: string }> {
    try {
      const { user } = await this.adminUsersValidator.validateResetUserMfa(resetMfaDto);

      const updatedUser = { ...user, status: 'ACTIVE' }; // Assuming 'ACTIVE' is the status for reset MFA
      await this.userRepository.updateUser(updatedUser);
      
      // await this.notificationQueue.add('mfa-reset', {
      //   userId: user.id,
      //   email: user.email,
      // });

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'User MFA reset successfully',
      });
    } catch (error) {
      return handleServiceError('Error resetting user MFA', error);
    }
  }

  async unlockUserAccount(unlockDto: any): Promise<{ status: number; message: string }> {
    try {
      const { user } = await this.adminUsersValidator.validateUnlockUserAccount(unlockDto);

      const updatedUser = { ...user, status: 'ACTIVE' }; // Assuming 'ACTIVE' is the status for unlocked account
      await this.userRepository.updateUser(updatedUser);
      
      // await this.notificationQueue.add('account-unlocked', {
      //   userId: user.id,
      //   email: user.email,
      // });

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'User account unlocked successfully',
      });
    } catch (error) {
      return handleServiceError('Error unlocking user account', error);
    }
  }

  async deactivateUserAccount(deactivateDto: any): Promise<{ status: number; message: string }> {
    try {
      const { user } = await this.adminUsersValidator.validateDeactivateUserAccount(deactivateDto);

      const updatedUser = { ...user, status: 'SUSPENDED' }; // Assuming 'SUSPENDED' is the status for deactivated account
      await this.userRepository.updateUser(updatedUser);
      
      // await this.notificationQueue.add('account-deactivated', {
      //   userId: user.id,
      //   email: user.email,
      // });

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'User account deactivated successfully',
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
        message: 'User account deleted successfully',
      });
    } catch (error) {
      return handleServiceError('Error deleting user account', error);
    }
  }

  async getUserStats(): Promise<{ status: number; message: string; data: any }> {
    try {
      // Use repository methods to get actual statistics
      const totalUsers = await this.userRepository.getUserCount();
      const activeUsers = await this.userRepository.getActiveUserCount();
      
      const stats: any = {
        totalUsers,
        activeUsers,
        inactiveUsers: 0, // TODO: Implement
        pendingUsers: 0, // TODO: Implement
        suspendedUsers: 0, // TODO: Implement
        emailVerifiedUsers: 0, // TODO: Implement
      };

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'User statistics retrieved successfully',
        data: stats,
      });
    } catch (error) {
      return handleServiceError('Error retrieving user statistics', error);
    }
  }

  async getSystemStats(): Promise<{ status: number; message: string; data: any }> {
    try {
      const totalUsers = await this.userRepository.getTotalUserCount();
      const activeUsers = await this.userRepository.getActiveUserCount();
      const pendingUsers = await this.userRepository.getPendingUserCount();
      const suspendedUsers = await this.userRepository.getSuspendedUserCount();

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'System stats retrieved successfully',
        data: {
          totalUsers,
          activeUsers,
          pendingUsers,
          suspendedUsers,
        },
      });
    } catch (error) {
      return handleServiceError('Error retrieving system stats', error);
    }
  }


} 