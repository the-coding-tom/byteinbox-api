import { BlacklistType, BlacklistReason, BlacklistDuration, Prisma } from '@prisma/client';

export interface BlacklistStats {
  totalBlacklists: number;
  activeBlacklists: number;
  expiredBlacklists: number;
  byType: Record<string, number>;
  byReason: Record<string, number>;
}

export class BlacklistEntity {
  id?: number;
  type: BlacklistType;
  value: string;
  reason: BlacklistReason;
  duration: BlacklistDuration;
  expiresAt?: Date;
  description?: string;
  metadata?: Prisma.InputJsonValue; // JSON for additional context
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
} 