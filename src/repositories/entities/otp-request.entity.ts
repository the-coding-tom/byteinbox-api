import { OtpRequestStatus, MfaMethod } from '@prisma/client';

export class OtpRequestEntity {
  id?: number;
  userId: number;
  sessionToken?: string;
  recipient?: string; // Unified field for email or phone number
  mfaMethod: MfaMethod;
  status: OtpRequestStatus;
  otpCode?: string;
  otpExpiresAt?: Date;
  ipAddress?: string;
  userAgent?: string;
  failureReason?: string;
  createdAt?: Date;
} 