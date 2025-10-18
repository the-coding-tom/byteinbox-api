export class GetLogsDto {
  page?: number;
  limit?: number;
  statusCode?: number;
  httpMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint?: string;
  startDate?: string;
  endDate?: string;
  apiKeyId?: number;
}

export class GetLogsResponseDto {
  logs: Array<{
    id: string;
    teamId: number;
    apiKeyId?: number;
    endpoint: string;
    httpMethod: string;
    statusCode: number;
    responseTime: number;
    ipAddress?: string;
    userAgent?: string;
    requestBody?: any;
    responseBody?: any;
    errorMessage?: string;
    errorCode?: string;
    createdAt: string;
    apiKey?: {
      id: number;
      name: string;
      permission: string;
      domain?: string;
    };
  }>;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class GetLogDetailsResponseDto {
  log: {
    id: string;
    teamId: number;
    apiKeyId?: number;
    endpoint: string;
    httpMethod: string;
    statusCode: number;
    responseTime: number;
    ipAddress?: string;
    userAgent?: string;
    requestBody?: any;
    responseBody?: any;
    errorMessage?: string;
    errorCode?: string;
    createdAt: string;
    apiKey?: {
      id: number;
      name: string;
      permission: string;
      domain?: string;
    };
  };
}
