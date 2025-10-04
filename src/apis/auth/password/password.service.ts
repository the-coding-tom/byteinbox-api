import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { UserRepository } from '../../../repositories/user.repository';
import { SessionRepository } from '../../../repositories/session.repository';
import { PasswordValidator } from './password.validator';
import { generateSuccessResponse } from '../../../utils/util';
import { handleServiceError } from '../../../utils/error.util';
import { hashPassword, generatePasswordResetToken } from '../../../utils/authentication.util';
import { PROCESS_NOTIFICATION_QUEUE } from '../../../common/constants/queues.constant';
import {
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  AuthResponse,
} from './dto/password.dto';

@Injectable()
export class PasswordService {
  constructor(
    private userRepository: UserRepository,
    private sessionRepository: SessionRepository,
    private passwordValidator: PasswordValidator,
    @InjectQueue(PROCESS_NOTIFICATION_QUEUE)
    private readonly notificationQueue: Queue,
  ) {}

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<AuthResponse> {
    try {
      // Validate forgot password data
      const { user } = await this.passwordValidator.validateForgotPassword(forgotPasswordDto);

      // Generate password reset token
      const { token, expiresAt } = generatePasswordResetToken();

      // Update user with reset token
      await this.userRepository.update(user.id, {
        passwordResetToken: token,
        passwordResetExpiresAt: expiresAt,
      });

      // Send notification
      await this.notificationQueue.add('password-reset', { userId: user.id, email: user.email });

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'Password reset email sent successfully',
        data: { userId: user.id, email: user.email },
      });
    } catch (error) {
      return handleServiceError('Error sending password reset email', error);
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<AuthResponse> {
    try {
      // Validate reset password data
      const { validatedData, user } = await this.passwordValidator.validateResetPassword(resetPasswordDto);

      // Hash new password
      const hashedPassword = await hashPassword(validatedData.password);

      // Update user password and clear reset token
      await this.userRepository.update(user.id, {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      });

      // Revoke all sessions for security
      await this.sessionRepository.revokeAllUserRefreshTokens(user.id);

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'Password reset successfully',
        data: { userId: user.id },
      });
    } catch (error) {
      return handleServiceError('Error resetting password', error);
    }
  }

  async changePassword(
    userId: number,
    changePasswordDto: ChangePasswordDto,
  ): Promise<AuthResponse> {
    try {
      // Validate change password data
      const { validatedData } = await this.passwordValidator.validateChangePassword(userId, changePasswordDto);

      // Hash new password
      const hashedPassword = await hashPassword(validatedData.newPassword);

      // Update user password
      await this.userRepository.update(userId, {
        password: hashedPassword,
      });

      // Revoke all sessions for security
      await this.sessionRepository.revokeAllUserRefreshTokens(userId);

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'Password changed successfully',
        data: { userId },
      });
    } catch (error) {
      return handleServiceError('Error changing password', error);
    }
  }
} 