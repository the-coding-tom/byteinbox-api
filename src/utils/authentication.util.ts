import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { config } from '../config/config';
import { JwtPayload } from '../common/entities/auth.entity';
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
    expiresIn: config.tokenExpirationInSeconds,
  });

  const refreshToken = jwtService.sign(refreshPayload, {
    secret: config.authRefreshJWTSecret,
    expiresIn: config.refreshTokenExpirationInSeconds,
  });

  return { accessToken, refreshToken };
}