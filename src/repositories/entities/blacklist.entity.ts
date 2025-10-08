import { BlacklistType } from '@prisma/client';

export interface BlacklistStats {
  totalBlacklists: number;
  byType: Record<string, number>;
}

export class BlacklistEntity {
  id?: number;
  type: BlacklistType;
  value: string;
  reason?: string;
  createdAt?: Date;
  createdBy?: number;
} 