import { BlacklistType, BlacklistDuration } from '@prisma/client';
import { BlacklistRepository } from '../repositories/blacklist.repository';
import { RateLimitContext, RateLimitResult } from '../common/entities/rate-limit.entity';

/**
 * Check if a user is blacklisted
 */
export async function checkBlacklist(
  blacklistRepository: BlacklistRepository,
  context: RateLimitContext
): Promise<RateLimitResult> {
  try {
    // Check blacklists
    const blacklistResult = await checkBlacklists(blacklistRepository, context);
    if (!blacklistResult.allowed) {
      return blacklistResult;
    }

    return {
      allowed: true,
      remainingAttempts: 5,
    };
  } catch (error) {
    console.error('Error in blacklist check:', error);
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
