import { HttpStatus, BadRequestException, HttpException } from '@nestjs/common';

import { CaughtError } from './entities/utils.entity';

export class RequestResponse {
  statusCode: number;
  message: string;
  data?: any;
  meta?: any;
}

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
    message: error.response.data.message,
  };

  if (!error.code || typeof error.code === 'string') return {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    message: 'Internal server error',
    errorCode: 'serverError',
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
