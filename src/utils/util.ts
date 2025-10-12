import { HttpStatus } from '@nestjs/common';
import { CaughtError, RequestResponse } from './entities/utils.entity';

export function generateSuccessResponse(response: RequestResponse) {
  if (!response.data) return {
    status: response.statusCode,
    message: response.message,
  };

  return {
    status: response.statusCode,
    message: response.message,
    data: response.data,
    ...(response?.meta && { meta: response.meta }),
  };
}

export function generateErrorResponse(error: CaughtError | any) {
  if (error.response && error.response.status === HttpStatus.BAD_REQUEST) return {
    status: error.response.status,
    errorCode: 'badRequest',
    message: error.response.data.message,
  };

  if (!error.code || typeof error.code === 'string') return {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    errorCode: 'serverError',
    message: 'Internal server error',
  };

  return {
    status: error.code,
    errorCode: error.errorCode,
    message: error.message,
  };
}

export function throwError(
  message: string,
  statusCode: number | null = null,
  errorCode: string | null = null,
) {
  // Create error with the structure expected by generateErrorResponse
  const error: any = new Error(message);
  error.code = statusCode;
  error.errorCode = errorCode;
  throw error;
}

/**
 * Transform raw pagination data from repository into formatted meta structure
 * @param paginationData - Raw pagination data from repository
 * @returns Formatted meta object with page and totalPages calculated
 */
export function transformToPaginationMeta(paginationData: {
  total: number;
  offset: number;
  limit: number;
}): {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} {
  return {
    total: paginationData.total,
    page: Math.floor(paginationData.offset / paginationData.limit) + 1,
    limit: paginationData.limit,
    totalPages: Math.ceil(paginationData.total / paginationData.limit),
  };
}