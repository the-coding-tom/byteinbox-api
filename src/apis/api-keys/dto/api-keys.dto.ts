export class CreateApiKeyDto {
  name: string;
  description?: string;
  scopes: string[];
  expiresAt?: Date;
}

export class UpdateApiKeyDto {
  name?: string;
  description?: string;
  scopes?: string[];
  isActive?: boolean;
  expiresAt?: Date;
}

export class GetApiKeysDto {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE';
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