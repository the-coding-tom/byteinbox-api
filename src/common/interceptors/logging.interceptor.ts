import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiRequestLogRepository } from '../../repositories/api-request-log.repository';
import { AuthenticatedRequest } from '../middlewares/is-authenticated.middleware';

/**
 * Logging Interceptor - Tracks all API requests and responses
 * Logs to ApiRequestLog table for analytics and debugging
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly apiRequestLogRepository: ApiRequestLogRepository,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const response = context.switchToHttp().getResponse();
    
    const startTime = Date.now();
    const { method, url, body, headers, ip } = request;
    
    // Extract relevant data
    const teamId = request.teamId;
    const apiKeyId = request.apiKeyId;
    const userAgent = headers['user-agent'];

    return next.handle().pipe(
      tap({
        next: (responseBody) => {
          // On successful response
          const responseTime = Date.now() - startTime;
          const statusCode = response.statusCode;

          // Log to database (fire and forget - don't block response)
          if (teamId) {
            this.logRequest({
              teamId,
              apiKeyId,
              endpoint: url,
              httpMethod: method,
              statusCode,
              responseTime,
              ipAddress: ip,
              userAgent,
              requestBody: this.sanitizeBody(body),
              responseBody: this.sanitizeBody(responseBody?.data || responseBody),
              errorMessage: null,
              errorCode: null,
            }).catch((error) => {
              console.error('Failed to log request:', error);
            });
          }
        },
        error: (error) => {
          // On error response
          const responseTime = Date.now() - startTime;
          const statusCode = error.status || 500;

          // Log error to database
          if (teamId) {
            this.logRequest({
              teamId,
              apiKeyId,
              endpoint: url,
              httpMethod: method,
              statusCode,
              responseTime,
              ipAddress: ip,
              userAgent,
              requestBody: this.sanitizeBody(body),
              responseBody: null,
              errorMessage: error.message || 'Unknown error',
              errorCode: error.code || error.name || 'INTERNAL_ERROR',
            }).catch((logError) => {
              console.error('Failed to log request error:', logError);
            });
          }
        },
      }),
    );
  }

  /**
   * Log request to database
   */
  private async logRequest(data: any): Promise<void> {
    await this.apiRequestLogRepository.create(data);
  }

  /**
   * Sanitize request/response body to avoid logging sensitive data
   */
  private sanitizeBody(body: any): any {
    if (!body) return null;

    // Don't log if body is too large (> 100KB)
    const bodyString = JSON.stringify(body);
    if (bodyString.length > 100000) {
      return { _truncated: true, size: bodyString.length };
    }

    // Remove sensitive fields
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'authorization'];
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}

