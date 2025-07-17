import { config } from '../config/config';

/**
 * Generates a random alphanumeric string
 * @param length - Length of the string to generate (defaults to config value)
 * @returns Random alphanumeric string
 */
export function generateRandomString(
  length: number = config.validation.randomString.defaultLength,
): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generates a numeric OTP (One-Time Password)
 * @param length - Length of the OTP (defaults to config value)
 * @returns Numeric OTP string
 */
export function generateNumericOtp(length: number = 6): string {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
}

/**
 * Generates an alphanumeric code (uppercase letters and numbers only)
 * @param length - Length of the code to generate
 * @returns Alphanumeric code string
 */
export function generateAlphanumericCode(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
