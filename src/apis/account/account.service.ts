import { Injectable, HttpStatus } from '@nestjs/common';
import { UserRepository } from '../../repositories/user.repository';
import { SessionRepository } from '../../repositories/session.repository';
import { AccountValidator } from './account.validator';
import { generateSuccessResponse } from '../../utils/util';
import { handleServiceError } from '../../utils/error.util';

@Injectable()
export class AccountService {
  constructor(
    private userRepository: UserRepository,
    private sessionRepository: SessionRepository,
    private accountValidator: AccountValidator,
  ) {}

  async deactivateAccount(userId: number): Promise<any> {
    try {
      // Validate user and account status
      await this.accountValidator.validateDeactivateAccount(userId);

      // Deactivate the user account
      await this.userRepository.update(userId, {
        status: 'SUSPENDED',
      });

      // Revoke all user sessions
      await this.sessionRepository.revokeAllUserRefreshTokens(userId);

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'Account deactivated successfully',
      });
    } catch (error) {
      return handleServiceError('Error deactivating account', error);
    }
  }

  async deleteAccount(userId: number, password: string): Promise<any> {
    try {
      // Validate user and password
      await this.accountValidator.validateDeleteAccount(userId, password);

      // Delete the user account
      await this.userRepository.delete(userId);

      // Revoke all user sessions
      await this.sessionRepository.revokeAllUserRefreshTokens(userId);

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'Account deleted successfully',
      });
    } catch (error) {
      return handleServiceError('Error deleting account', error);
    }
  }
} 