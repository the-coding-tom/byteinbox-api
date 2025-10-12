export class CreateApiKeyData {
  key: string;
  name: string;
  teamId: number;
  permission: string;
  domain?: string;
  createdBy?: number;
}

import { ApiKeyStatus } from '@prisma/client';

export class UpdateApiKeyData {
  name?: string;
  permission?: string;
  domain?: string;
  status?: ApiKeyStatus;
  key?: string;
}

export class FindByTeamIdWithPaginationFilter {
  teamId: number;
  status?: string;
  keyword?: string;
  offset: number;
  limit: number;
}

