export class LogFilterDto {
  page?: number;
  limit?: number;
  status?: string;
  method?: string;
  endpoint?: string;
  startDate?: string;
  endDate?: string;
}

export class GetLogsResponseDto {
  logs: Array<{
    id: string;
    apiKeyId?: string;
    endpoint: string;
    method: string;
    status: string;
    userAgent?: string;
    requestBody?: any;
    responseBody?: any;
    timestamp: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class GetLogDetailsResponseDto {
  log: {
    id: string;
    apiKeyId?: string;
    endpoint: string;
    method: string;
    status: string;
    userAgent?: string;
    requestBody?: any;
    responseBody?: any;
    timestamp: string;
    apiKey?: {
      id: string;
      name: string;
      permission: string;
      domain?: string;
    };
  };
}
