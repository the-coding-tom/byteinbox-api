export class LoginContext {
  userId: number;
  email: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
  timestamp: Date;
  createdAt?: Date;
}

export class SuspiciousLoginResult {
  isSuspicious: boolean;
  riskScore: number;
  reasons: string[];
  shouldBlock: boolean;
  shouldAlert: boolean;
  confidence?: number;
} 