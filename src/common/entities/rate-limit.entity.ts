import { MfaMethod } from '@prisma/client';

export class RateLimitContext {
  userId: number;
  mfaMethod: MfaMethod;
  sessionToken?: string;
  recipient?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class RateLimitResult {
  allowed: boolean;
  nextAttemptWaitMinutes?: number;
  blockedUntil?: Date;
  remainingAttempts: number;
  isPermanentlyBlocked?: boolean;
} 