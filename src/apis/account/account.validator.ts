import { Injectable, HttpStatus } from '@nestjs/common';
import { UserRepository } from '../../repositories/user.repository';
import { throwError } from '../../utils/util';
import { validatePassword } from '../../utils/authentication.util';
import { UserEntity } from '../../repositories/entities/user.entity';

@Injectable()
export class AccountValidator {
  constructor(private readonly userRepository: UserRepository) {}

  async validateDeactivateAccount(userId: number): Promise<UserEntity> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throwError('User not found', HttpStatus.NOT_FOUND, 'userNotFound');
    }

    // Check if account is already deactivated
    if (user.status === 'SUSPENDED') {
      throwError('Account is already deactivated', HttpStatus.BAD_REQUEST, 'accountAlreadyDeactivated');
    }

    return user as UserEntity;
  }

  async validateDeleteAccount(userId: number, password: string): Promise<UserEntity> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throwError('User not found', HttpStatus.NOT_FOUND, 'userNotFound');
    }

    // Validate password for OAuth users
    if (!user.password) {
      throwError('Cannot delete OAuth user account', HttpStatus.BAD_REQUEST, 'oauthUserDeleteNotAllowed');
    }

    // Validate current password
    const isPasswordValid = await validatePassword(password, user.password);
    if (!isPasswordValid) {
      throwError('Invalid password', HttpStatus.BAD_REQUEST, 'invalidPassword');
    }

    return user as UserEntity;
  }
} 