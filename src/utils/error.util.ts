import { generateErrorResponse } from './util';
import { logError } from './logger';

/**
 * Handle service errors consistently
 */
export function handleServiceError(context: string, error: any): any {
  const errorMessage = `${context} ==> ${error}`;
  logError(errorMessage);
  return generateErrorResponse(error);
} 