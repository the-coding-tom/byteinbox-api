import { BlacklistType, BlacklistReason, BlacklistDuration } from '@prisma/client';

// Admin Security DTOs
export class GetSecurityActivityDto {
  userId?: number;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export class GetBlacklistStatsDto {
  startDate?: string;
  endDate?: string;
}

export class GetBlacklistEntriesDto {
  offset?: number;
  limit?: number;
  type?: BlacklistType;
  isActive?: boolean;
  keyword?: string;
}

export class CreateBlacklistEntryDto {
  type: BlacklistType;
  value: string;
  reason: BlacklistReason;
  duration: BlacklistDuration;
  description?: string;
  metadata?: any;
}

export class UpdateBlacklistEntryDto {
  reason?: BlacklistReason;
  duration?: BlacklistDuration;
  description?: string;
  metadata?: any;
  isActive?: boolean;
}

export class GetRateLimitStatsDto {
  userId?: number;
  startDate?: string;
  endDate?: string;
}

export class ClearUserRateLimitsDto {
  userId: number;
}

export class ClearBlacklistEntryDto {
  id: number;
}

// Admin Security Response DTOs
export class SecurityActivityResponse {
  id: number;
  userId: number;
  userEmail: string;
  action: string;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: Date;
  details: any;
}

export class SecurityActivityListResponse {
  data: SecurityActivityResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class BlacklistStatsResponse {
  totalEntries: number;
  activeEntries: number;
  expiredEntries: number;
  permanentEntries: number;
  temporaryEntries: number;
  entriesByType: {
    ip: number;
    email: number;
    phone: number;
    user: number;
  };
}

export class RateLimitStatsResponse {
  totalRateLimits: number;
  activeRateLimits: number;
  expiredRateLimits: number;
  rateLimitsByType: {
    login: number;
    mfa: number;
    otp: number;
    passwordReset: number;
  };
} 