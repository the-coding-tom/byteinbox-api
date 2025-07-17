import { MfaMethod } from '@prisma/client';

export class UserEntity {
  id: number;
  email: string;
  password: string | null;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt: Date | null;
  oauthProvider: string | null;
  oauthId: string | null;
  mfaEnabled: boolean;
  mfaMethod: MfaMethod | null;
  totpSecret: string | null;
  emailOtp: string | null;
  emailOtpExpiresAt: Date | null;
  smsOtp: string | null;
  smsOtpExpiresAt: Date | null;
  emailVerificationToken: string | null;
  emailVerificationExpiresAt: Date | null;
  passwordResetToken: string | null;
  passwordResetExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: number | null;
  updatedBy: number | null;
}
