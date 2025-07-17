import { InjectQueue } from '@nestjs/bull';
import { Injectable, HttpStatus } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Queue } from 'bull';

import { PROCESS_NOTIFICATION_QUEUE } from '../../common/constants/queues.constant';
import { Constants } from '../../common/enums/generic.enum';
import { config } from '../../config/config';
import { UserRepository } from '../../repositories/user.repository';
import { logError, logInfoMessage } from '../../utils/logger';
import { generateSuccessResponse, generateErrorResponse } from '../../utils/util';

import { CreateUserDto, UpdateUserDto, UserFilterDto } from './dto/users.dto';
import { UsersValidator } from './users.validator';
@Injectable()
export class UsersService {
  constructor(
    private readonly validator: UsersValidator,
    private readonly repository: UserRepository,
    @InjectQueue(PROCESS_NOTIFICATION_QUEUE) private readonly notificationQueue: Queue,
  ) {}
  async createUser(requestBody: CreateUserDto): Promise<any> {
    try {
      // Step 1: Validation
      const validatedParams = await this.validator.validateCreateRequest(requestBody);
      // Step 2: Business logic - hash password
      const hashedPassword = await bcrypt.hash(validatedParams.password, config.bcryptSaltRounds);
      const userData = {
        ...validatedParams,
        password: hashedPassword,
      };
      const result = await this.repository.create(userData);
      // Step 3: Additional processing - queue notification
      await this.notificationQueue.add('user-created', {
        userId: result.id,
        email: result.email,
      });
      logInfoMessage(`User created successfully: ${result.email}`);
      // Step 4: Response formatting
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.successMessage,
        data: result,
      });
    } catch (error) {
      const errorMessage = `Error creating user ==> ${error}`;
      logError(errorMessage);
      return generateErrorResponse(error);
    }
  }
  async getUsers(filter: UserFilterDto): Promise<any> {
    try {
      const validatedParams = await this.validator.validateGetUsersRequest(filter);
      const { data, meta } = await this.repository.findWithPagination(validatedParams);
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.successMessage,
        data,
        meta,
      });
    } catch (error) {
      const errorMessage = `Error retrieving users ==> ${error}`;
      logError(errorMessage);
      return generateErrorResponse(error);
    }
  }
  async getUserById(id: string): Promise<any> {
    try {
      const userId = await this.validator.validateGetUserByIdRequest(id);
      const user = await this.repository.findById(userId);
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.successMessage,
        data: user,
      });
    } catch (error) {
      const errorMessage = `Error retrieving user by ID ==> ${error}`;
      logError(errorMessage);
      return generateErrorResponse(error);
    }
  }
  async updateUser(requestBody: UpdateUserDto): Promise<any> {
    try {
      // Step 1: Validation
      const validatedParams = await this.validator.validateUpdateRequest(requestBody);
      // Step 2: Business logic
      const { id, ...updateData } = validatedParams;
      const result = await this.repository.update(id, updateData);
      // Step 3: Additional processing
      await this.notificationQueue.add('user-updated', {
        userId: result.id,
        email: result.email,
      });
      logInfoMessage(`User updated successfully: ${result.email}`);
      // Step 4: Response formatting
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.successMessage,
        data: result,
      });
    } catch (error) {
      const errorMessage = `Error updating user ==> ${error}`;
      logError(errorMessage);
      return generateErrorResponse(error);
    }
  }
  async deleteUser(id: string): Promise<any> {
    try {
      const userId = await this.validator.validateGetUserByIdRequest(id);
      await this.repository.delete(userId);
      logInfoMessage(`User deleted successfully: ID ${userId}`);
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'User deleted successfully',
      });
    } catch (error) {
      const errorMessage = `Error deleting user ==> ${error}`;
      logError(errorMessage);
      return generateErrorResponse(error);
    }
  }
}
