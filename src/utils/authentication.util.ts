import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';


import { config } from '../config/config';
import { UserEntity } from '../repositories/entities/user.entity';
import { JwtPayload } from '../common/entities/auth.entity';
import {
  PASSWORD_RESET_TOKEN_EXPIRY_MINUTES,
  MILLISECONDS_IN_MINUTE,
} from '../common/constants/time.constant';
import {
  validateEmail as validateEmailUtil,
  validatePasswordStrength as validatePasswordStrengthUtil,
} from './validation.util';

// Password functions
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, config.bcryptSaltRounds);
}

export async function validatePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// Validation functions
export function validateEmail(email: string): boolean {
  return validateEmailUtil(email);
}

export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  return validatePasswordStrengthUtil(password);
}

// Token generation functions
export async function generateTokens(
  user: any,
  jwtService: JwtService,
): Promise<{ accessToken: string; refreshToken: string }> {
  const accessPayload: JwtPayload = {
    sub: user.id,
    email: user.email,
    userType: user.userType,
    status: user.status,
    isEmailVerified: user.isEmailVerified,
  };

  const refreshPayload: JwtPayload & { type: string } = {
    ...accessPayload,
    type: 'refresh',
  };

  const accessToken = jwtService.sign(accessPayload, {
    secret: config.authJWTSecret,
    expiresIn: config.tokenExpiration,
  });

  const refreshToken = jwtService.sign(refreshPayload, {
    secret: config.authRefreshJWTSecret,
    expiresIn: config.refreshTokenExpiration,
  });

  return { accessToken, refreshToken };
}

// User update functions
export async function updateUserLoginTime(user: UserEntity, authRepository: any): Promise<void> {
  const updatedUser = { ...user, lastLoginAt: new Date() };
  await authRepository.updateUser(updatedUser);
}

// Password reset token generation
export function generatePasswordResetToken(): { token: string; expiresAt: Date } {
  const passwordResetToken = uuidv4();
  const passwordResetExpiresAt = new Date(
    Date.now() + PASSWORD_RESET_TOKEN_EXPIRY_MINUTES * MILLISECONDS_IN_MINUTE,
  );

  return { token: passwordResetToken, expiresAt: passwordResetExpiresAt };
}
