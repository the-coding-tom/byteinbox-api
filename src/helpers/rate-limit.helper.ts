import { BlacklistType } from '@prisma/client';
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
 * Check blacklists (IP, user account, domain, etc.)
 * Note: USER_AGENT blacklist type removed from new schema
 */
async function checkBlacklists(blacklistRepository: BlacklistRepository, context: RateLimitContext): Promise<RateLimitResult> {
  const checks = [
    blacklistRepository.findBlacklist(BlacklistType.USER_ID, context.userId.toString()),
    blacklistRepository.findBlacklist(BlacklistType.IP_ADDRESS, context.ipAddress || ''),
    // USER_AGENT type no longer exists in schema
  ];

  const results = await Promise.all(checks);
  const activeBlacklist = results.find(result => result !== null);

  if (activeBlacklist) {
    return {
      allowed: false,
      isPermanentlyBlocked: true, // All blacklists are permanent in new schema
      nextAttemptWaitMinutes: 0,
      remainingAttempts: 0,
    };
  }

  return { allowed: true, remainingAttempts: 5 };
}
