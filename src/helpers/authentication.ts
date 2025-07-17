import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import { config } from '../config/config';
import { generateRandomString as generateRandomStringUtil } from '../utils/string.util';
import {
  validateEmail as validateEmailUtil,
  validatePasswordStrength as validatePasswordStrengthUtil,
} from '../utils/validation.util';

export interface TokenPayload {
  sub: number;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthenticationHelper {
  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, config.bcryptSaltRounds);
  }

  async validatePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  validateEmail(email: string): boolean {
    return validateEmailUtil(email);
  }

  validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
    return validatePasswordStrengthUtil(password);
  }

  generateRandomString(length: number = config.validation.randomString.defaultLength): string {
    return generateRandomStringUtil(length);
  }
}

// Export individual functions for backwards compatibility
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, config.bcryptSaltRounds);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// Re-export utility functions for backwards compatibility
export { validateEmail, validatePasswordStrength } from '../utils/validation.util';
export { generateRandomString } from '../utils/string.util';
