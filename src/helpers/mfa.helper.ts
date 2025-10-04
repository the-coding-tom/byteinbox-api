
import { TotpSetupResult } from '../common/entities/mfa.entity';
import {
  generateTotpSecret,
  generateQrCode,
  verifyTotpCode as verifyTotpCodeUtil,
  generateBackupCodes as generateBackupCodesUtil,
  hashBackupCode as hashBackupCodeUtil,
  verifyBackupCode as verifyBackupCodeUtil,
  generateSessionToken as generateSessionTokenUtil,
} from '../utils/crypto.util';

// MFA Business Logic Functions
export async function setupTotp(userEmail: string): Promise<TotpSetupResult> {
  const totpResult = generateTotpSecret(userEmail);
  totpResult.qrCode = await generateQrCode(totpResult.secret, userEmail);
  return totpResult;
}

// Re-export utility functions for backward compatibility
export const verifyTotpCode = verifyTotpCodeUtil;
export const generateBackupCodes = generateBackupCodesUtil;
export const hashBackupCode = hashBackupCodeUtil;
export const verifyBackupCode = verifyBackupCodeUtil;
export const generateSessionToken = generateSessionTokenUtil;
