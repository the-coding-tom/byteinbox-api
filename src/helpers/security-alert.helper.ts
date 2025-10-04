import { LoginContext, SuspiciousLoginResult } from '../common/entities/security.entity';
import { logInfoMessage, logWarningMessage } from '../utils/logger';

/**
 * Detects suspicious login activity by comparing current login with recent successful logins
 */
export function detectSuspiciousLogin(
  recentLogins: LoginContext[],
  currentLogin: LoginContext
): SuspiciousLoginResult {
  const reasons: string[] = [];
  let confidence = 0;

  logInfoMessage(`SecurityAlert: Analyzing login for IP: ${maskIpAddress(currentLogin.ipAddress)}, UserAgent: ${truncateUserAgent(currentLogin.userAgent)}`);

  if (recentLogins.length === 0) {
    // First login - not suspicious
    logInfoMessage('SecurityAlert: First login detected - not suspicious');
    return {
      isSuspicious: false,
      riskScore: 0,
      reasons: [],
      shouldBlock: false,
      shouldAlert: false,
      confidence: 0,
    };
  }

  // Check for new IP address
  const knownIp = recentLogins.some(login => login.ipAddress === currentLogin.ipAddress);
  if (!knownIp) {
    reasons.push('New IP address detected');
    confidence += 0.3;
    logInfoMessage(`SecurityAlert: New IP address detected: ${maskIpAddress(currentLogin.ipAddress)}`);
  }

  // Check for new user agent
  const knownUserAgent = recentLogins.some(login => login.userAgent === currentLogin.userAgent);
  if (!knownUserAgent) {
    reasons.push('New device/browser detected');
    confidence += 0.3;
    logInfoMessage(`SecurityAlert: New device/browser detected: ${truncateUserAgent(currentLogin.userAgent)}`);
  }

  // Check for new location (if available)
  if (currentLogin.location) {
    const knownLocation = recentLogins.some(login => login.location === currentLogin.location);
    if (!knownLocation) {
      reasons.push('New location detected');
      confidence += 0.4;
      logInfoMessage(`SecurityAlert: New location detected: ${currentLogin.location}`);
    }
  }

  // Check for rapid login attempts (multiple logins in short time)
  const recentLoginsCount = recentLogins.filter(login => {
    const timeDiff = Date.now() - (login.createdAt || login.timestamp).getTime();
    return timeDiff < 24 * 60 * 60 * 1000; // Last 24 hours
  }).length;

  if (recentLoginsCount >= 3) {
    reasons.push('Multiple logins in short time period');
    confidence += 0.2;
    logInfoMessage(`SecurityAlert: Multiple logins detected in 24h: ${recentLoginsCount}`);
  }

  // Cap confidence at 1.0
  confidence = Math.min(confidence, 1.0);

  const result: SuspiciousLoginResult = {
    isSuspicious: confidence >= 0.3, // Threshold for considering suspicious
    riskScore: confidence,
    reasons,
    shouldBlock: confidence >= 0.8, // High confidence triggers block
    shouldAlert: confidence >= 0.3, // Medium confidence triggers alert
    confidence,
  };

  if (result.isSuspicious) {
    logWarningMessage(`SecurityAlert: Suspicious login detected! Confidence: ${confidence}, Reasons: ${reasons.join(', ')}`);
  } else {
    logInfoMessage(`SecurityAlert: Login appears normal. Confidence: ${confidence}`);
  }

  return result;
}

/**
 * Determines if a login attempt should trigger a security alert
 */
export function shouldTriggerSecurityAlert(
  suspiciousResult: SuspiciousLoginResult,
  failedAttemptsCount: number
): boolean {
  // Always trigger if suspicious login detected
  if (suspiciousResult.isSuspicious) {
    logInfoMessage(`SecurityAlert: Triggering alert due to suspicious login (confidence: ${suspiciousResult.confidence})`);
    return true;
  }

  // Trigger if too many failed attempts
  if (failedAttemptsCount >= 3) {
    logInfoMessage(`SecurityAlert: Triggering alert due to multiple failed attempts (${failedAttemptsCount} attempts)`);
    return true;
  }

  logInfoMessage(`SecurityAlert: No alert triggered - login appears normal`);
  return false;
}

/**
 * Generates a security alert message based on the suspicious activity
 */
export function generateSecurityAlertMessage(
  suspiciousResult: SuspiciousLoginResult,
  failedAttemptsCount: number,
  loginContext: LoginContext
): string {
  const messages: string[] = [];

  if (suspiciousResult.isSuspicious) {
    messages.push('We detected a login to your account from a new device or location.');
    
    if (suspiciousResult.reasons.includes('New IP address detected')) {
      messages.push(`Login from IP: ${maskIpAddress(loginContext.ipAddress)}`);
    }
    
    if (suspiciousResult.reasons.includes('New location detected') && loginContext.location) {
      messages.push(`Location: ${loginContext.location}`);
    }
  }

  if (failedAttemptsCount >= 3) {
    messages.push(`Multiple failed login attempts detected (${failedAttemptsCount} attempts).`);
  }

  messages.push('If this was not you, please reset your password immediately and contact support.');

  const finalMessage = messages.join(' ');
  logInfoMessage(`SecurityAlert: Generated alert message: ${finalMessage}`);
  
  return finalMessage;
}

/**
 * Masks an IP address for privacy (shows only first two octets)
 */
function maskIpAddress(ipAddress: string): string {
  const parts = ipAddress.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.***.***`;
  }
  return ipAddress;
}

/**
 * Truncates user agent for privacy
 */
function truncateUserAgent(userAgent: string): string {
  if (userAgent.length > 50) {
    return userAgent.substring(0, 50) + '...';
  }
  return userAgent;
} 