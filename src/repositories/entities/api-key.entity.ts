export class CreateApiKeyData {
  key: string;
  name: string;
  teamId: number;
  permission: string;
  domain?: string;
  createdBy: number;
}

export class UpdateApiKeyData {
  name?: string;
  permission?: string;
  domain?: string;
}

export class FindByTeamIdWithPaginationFilter {
  teamId: number;
  status?: 'active' | 'revoked' | undefined;
  keyword?: string;
  offset: number;
  limit: number;
}

