import * as crypto from 'crypto';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import * as Chance from 'chance';
import { config } from '../config/config';
import { TotpSetupResult } from '../common/entities/mfa.entity';

// TOTP Functions (Pure utility functions)
export function generateTotpSecret(userEmail: string): TotpSetupResult {
  const secret = speakeasy.generateSecret({
    name: userEmail,
    issuer: config.email.fromName,
    length: 32,
  });

  return {
    secret: secret.base32,
    qrCode: '', // Will be populated by generateQrCode
    manualEntryKey: secret.base32,
  };
}

export async function generateQrCode(secret: string, userEmail: string): Promise<string> {
  const otpAuthUrl = speakeasy.otpauthURL({
    secret,
    label: userEmail,
    issuer: config.email.fromName,
    encoding: 'base32',
  });

  return await QRCode.toDataURL(otpAuthUrl);
}

export function verifyTotpCode(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: config.mfa.totpWindow,
  });
}

// Backup Code Functions (Pure utility functions)
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  const chance = new Chance();
  for (let i = 0; i < count; i++) {
    codes.push(chance.string({ length: 8, pool: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' }));
  }
  return codes;
}

export function hashBackupCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

export function verifyBackupCode(providedCode: string, hashedCode: string): boolean {
  const hashedProvidedCode = hashBackupCode(providedCode);
  return hashedProvidedCode === hashedCode;
}

// Token Generation Functions (Pure utility functions)
export function generateSessionToken(): string {
  const randomBytes = crypto.randomBytes(32);
  return crypto.createHash('sha256').update(randomBytes).digest('hex');
}

export function generateApiKey(): string {
  const randomPart = crypto.randomBytes(32).toString('hex');
  return `byt_${randomPart}`;
}

export function generateRandomString(length: number): string {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

// Validation Functions (Pure utility functions)
export function isValidApiKeyFormat(key: string): boolean {
  return key.startsWith('byt_') && key.length >= 68; // byt_ (4) + 64 hex chars
} 