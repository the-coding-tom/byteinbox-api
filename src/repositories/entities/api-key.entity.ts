export class CreateApiKeyData {
  name: string;
  description?: string;
  userId: number;
  scopes: string[];
  expiresAt?: Date;
}

export class UpdateApiKeyData {
  name?: string;
  description?: string;
  scopes?: string[];
  isActive?: boolean;
  expiresAt?: Date;
  key?: string; // For key regeneration
}

export class ApiKeyFilter {
  userId?: number;
  isActive?: boolean;
  offset: number;
  limit: number;
  keyword?: string;
}

export class ApiKeyEntity {
  id: number;
  key: string;
  name: string;
  description: string | null;
  userId: number;
  scopes: string[];
  isActive: boolean;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
} 