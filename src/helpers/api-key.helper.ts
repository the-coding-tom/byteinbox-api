import { generateApiKey as generateApiKeyUtil, isValidApiKeyFormat as isValidApiKeyFormatUtil } from '../utils/crypto.util';
import { isExpired as isExpiredUtil } from '../utils/date.util';

// API Key Business Logic Functions

/**
 * Check if an API key is expired
 */
export function isExpired(apiKey: any): boolean {
  return isExpiredUtil(apiKey.expiresAt);
}

/**
 * Check if an API key is valid (active and not expired)
 */
export function isValid(apiKey: any): boolean {
  return apiKey.isActive && !isExpired(apiKey);
}

/**
 * Check if an API key has a specific scope
 */
export function hasScope(apiKey: any, scope: string): boolean {
  return apiKey.scopes.includes(scope);
}

/**
 * Check if an API key has any of the specified scopes
 */
export function hasAnyScope(apiKey: any, scopes: string[]): boolean {
  return scopes.some(scope => hasScope(apiKey, scope));
}

/**
 * Check if an API key has all of the specified scopes
 */
export function hasAllScopes(apiKey: any, scopes: string[]): boolean {
  return scopes.every(scope => hasScope(apiKey, scope));
}

/**
 * Generate a new API key
 */
export function generateApiKey(): string {
  return generateApiKeyUtil();
}

/**
 * Validate API key format
 */
export function isValidApiKeyFormat(key: string): boolean {
  return isValidApiKeyFormatUtil(key);
}

/**
 * Get API key usage statistics
 */
export function calculateUsageStats(logs: any[]): {
  totalRequests: number;
  errorRate: number;
  avgResponseTime: number;
  lastUsedAt: Date | null;
} {
  if (logs.length === 0) {
    return {
      totalRequests: 0,
      errorRate: 0,
      avgResponseTime: 0,
      lastUsedAt: null,
    };
  }

  const totalRequests = logs.length;
  const errorRequests = logs.filter(log => log.statusCode >= 400).length;
  const errorRate = (errorRequests / totalRequests) * 100;
  
  const responseTimes = logs
    .filter(log => log.responseTimeMs !== null)
    .map(log => log.responseTimeMs);
  
  const avgResponseTime = responseTimes.length > 0 
    ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
    : 0;

  const lastUsedAt = logs.length > 0 ? logs[0].createdAt : null;

  return {
    totalRequests,
    errorRate,
    avgResponseTime,
    lastUsedAt,
  };
} 