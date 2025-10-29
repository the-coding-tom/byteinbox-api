export class CreateApiKeyDto {
  name: string;
  permission: string;
  domainId?: number;
}

export class CreateApiKeyResponseDto {
  id: string;
  token: string;
}

export class UpdateApiKeyDto {
  name?: string;
  permission?: string;
  domainId?: number;
}

export class UpdateApiKeyResponseDto {
  id: string;
}

export class GetApiKeysDto {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'revoked';
}

export class ApiKeyResponseDto {
  id: number;
  key: string;
  name: string;
  description?: string;
  scopes: string[];
  isActive: boolean;
  lastUsedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class ApiKeyListResponseDto {
  data: ApiKeyResponseDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class ApiKeyStatsDto {
  totalRequests: number;
  lastUsedAt?: Date;
  errorRate: number;
  avgResponseTime: number;
}

export class ApiKeyTestResponseDto {
  teamId: number;
  name: string;
  scopes: string[];
} 