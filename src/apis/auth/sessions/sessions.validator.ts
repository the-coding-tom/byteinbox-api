import { Injectable, HttpStatus } from '@nestjs/common';
import { UserRepository } from '../../../repositories/user.repository';
import { throwError } from '../../../utils/util';


@Injectable()
export class SessionsValidator {
  constructor(private readonly userRepository: UserRepository) {}

  async validateGetActiveSessions(userId: number): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throwError('User not found', HttpStatus.NOT_FOUND, 'userNotFound');
    }
  }

  async validateRevokeAllSessions(userId: number): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throwError('User not found', HttpStatus.NOT_FOUND, 'userNotFound');
    }
  }
} 