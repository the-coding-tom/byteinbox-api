import { MfaMethod } from '@prisma/client';

export class OtpRateLimitEntity {
  id?: number;
  userId: number;
  mfaMethod: MfaMethod;
  attemptCount: number;
  lastAttemptAt: Date;
  blockedUntil?: Date;
  createdAt?: Date;
  updatedAt?: Date;
} 