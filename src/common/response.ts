export interface SuccessResponse {
  statusCode: number;
  message: string;
  data?: any;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

export interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
}
