import { BlacklistType, BlacklistDuration } from '@prisma/client';
import { MfaRepository } from '../repositories/mfa.repository';
import { BlacklistRepository } from '../repositories/blacklist.repository';
import { RateLimitContext, RateLimitResult } from '../common/entities/rate-limit.entity';

/**
 * Check if a user can make an OTP request and immediately reserve the slot
 */
export async function checkAndReserveRateLimit(
  mfaRepository: MfaRepository,
  blacklistRepository: BlacklistRepository,
  context: RateLimitContext
): Promise<RateLimitResult> {
  try {
    // Check blacklists first
    const blacklistResult = await checkBlacklists(blacklistRepository, context);
    if (!blacklistResult.allowed) {
      return blacklistResult;
    }

    // Check rate limits
    const rateLimitResult = await checkRateLimits(mfaRepository, context);
    if (!rateLimitResult.allowed) {
      return rateLimitResult;
    }

    // If all checks pass, reserve the rate limit
    await reserveRateLimit(mfaRepository, context);

    return {
      allowed: true,
      remainingAttempts: rateLimitResult.remainingAttempts,
    };
  } catch (error) {
    console.error('Error in rate limit check:', error);
    return {
      allowed: false,
      isPermanentlyBlocked: false,
      nextAttemptWaitMinutes: 15,
      remainingAttempts: 0,
    };
  }
}

/**
 * Check blacklists (IP, user account, device fingerprint, etc.)
 */
async function checkBlacklists(blacklistRepository: BlacklistRepository, context: RateLimitContext): Promise<RateLimitResult> {
  const checks = [
    blacklistRepository.findBlacklist(BlacklistType.EMAIL, context.userId.toString()),
    blacklistRepository.findBlacklist(BlacklistType.IP_ADDRESS, context.ipAddress || ''),
    blacklistRepository.findBlacklist(BlacklistType.USER_AGENT, context.userAgent || ''),
  ];

  const results = await Promise.all(checks);
  const activeBlacklist = results.find(result => result && result.isActive);

  if (activeBlacklist) {
    return {
      allowed: false,
      isPermanentlyBlocked: activeBlacklist.duration === BlacklistDuration.PERMANENT,
      nextAttemptWaitMinutes: activeBlacklist.expiresAt 
        ? Math.ceil((activeBlacklist.expiresAt.getTime() - Date.now()) / (1000 * 60))
        : 0,
      remainingAttempts: 0,
    };
  }

  return { allowed: true, remainingAttempts: 5 };
}

/**
 * Check rate limits for the specific MFA method
 */
async function checkRateLimits(mfaRepository: MfaRepository, context: RateLimitContext): Promise<RateLimitResult> {
  const rateLimit = await mfaRepository.getOtpRateLimit(context.userId, context.mfaMethod);

  if (!rateLimit) {
    return { allowed: true, remainingAttempts: 5 };
  }

  // Check if user is currently blocked
  if (rateLimit.blockedUntil && rateLimit.blockedUntil > new Date()) {
    const waitMinutes = Math.ceil((rateLimit.blockedUntil.getTime() - Date.now()) / (1000 * 60));
    return {
      allowed: false,
      isPermanentlyBlocked: false,
      nextAttemptWaitMinutes: waitMinutes,
      remainingAttempts: 0,
    };
  }

  // Check attempt count
  const maxAttempts = context.mfaMethod === 'EMAIL' ? 5 : 3;
  const remainingAttempts = Math.max(0, maxAttempts - rateLimit.attemptCount);

  if (remainingAttempts <= 0) {
    // Calculate block duration based on violation count
    const blockDuration = Math.min(rateLimit.attemptCount * 15, 1440); // Max 24 hours


    // Update rate limit with block - we'll need to handle this differently since the repository doesn't support blockedUntil
    // For now, we'll just return the block result without updating the database
    return {
      allowed: false,
      isPermanentlyBlocked: false,
      nextAttemptWaitMinutes: blockDuration,
      remainingAttempts: 0,
    };
  }

  return {
    allowed: true,
    remainingAttempts,
  };
}

/**
 * Reserve rate limit (increment attempt count)
 */
async function reserveRateLimit(mfaRepository: MfaRepository, context: RateLimitContext): Promise<void> {
  const rateLimit = await mfaRepository.getOtpRateLimit(context.userId, context.mfaMethod);

  const updatedRateLimit = {
    userId: context.userId,
    mfaMethod: context.mfaMethod,
    attemptCount: (rateLimit?.attemptCount || 0) + 1,
  };

  await mfaRepository.createOrUpdateOtpRateLimit(updatedRateLimit);
} 