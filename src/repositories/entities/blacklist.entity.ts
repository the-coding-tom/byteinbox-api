import { BlacklistType } from '@prisma/client';

export class FindAllBlacklistsFilter {
  offset: number;
  limit: number;
  type?: string;
  keyword?: string;
}

export class CreateBlacklistData {
  type: BlacklistType;
  value: string;
  reason?: string;
  createdBy?: number;
}
