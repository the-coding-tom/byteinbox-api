import { HttpStatus } from '@nestjs/common';

// Utility functions for API responses following the style guide patterns

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  status?: number;
}

export function createSuccessResponse<T>(
  data: T,
  message: string = 'Operation successful',
): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
  };
}

export function createErrorResponse(
  message: string,
  status: number = HttpStatus.BAD_REQUEST,
  error?: string,
): ApiResponse {
  return {
    success: false,
    message,
    error: error || message,
    status,
  };
}

export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
  message: string = 'Data retrieved successfully',
): ApiResponse<{
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}> {
  const pages = Math.ceil(total / limit);

  return {
    success: true,
    message,
    data: {
      items: data,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1,
      },
    },
  };
}
