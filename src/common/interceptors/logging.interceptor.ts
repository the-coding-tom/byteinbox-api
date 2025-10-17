import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiRequestLogRepository } from '../../repositories/api-request-log.repository';
import { AuthenticatedRequest } from '../types/request.types';

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
    
    if (!this.shouldLogEndpoint(url)) {
      return next.handle();
    }
    
    const teamId = request.team?.id;
    const apiKeyId = request.apiKeyId;
    const userAgent = headers['user-agent'];

    // Capture response body by overriding res.json()
    let capturedBody: any = null;
    const originalJson = response.json.bind(response);
    
    response.json = function(body: any) {
      capturedBody = body;
      return originalJson(body);
    };

    return next.handle().pipe(
      tap({
        next: () => {
          const responseTime = Date.now() - startTime;
          const statusCode = response.statusCode;

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
              requestBody: body,
              responseBody: capturedBody,
              errorMessage: null,
              errorCode: null,
            }).catch((error) => {
              console.error('Failed to log request:', error);
            });
          }
        },
        error: (error) => {
          const responseTime = Date.now() - startTime;
          const statusCode = error.status || 500;

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
              requestBody: body,
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

  private async logRequest(data: any): Promise<void> {
    await this.apiRequestLogRepository.create(data);
  }

  private shouldLogEndpoint(url: string): boolean {
    const excludedEndpoints = [
      '/api/v1/auth/login',
      '/api/v1/auth/signup',
      '/api/v1/auth/refresh',
      '/api/v1/auth/reset-password',
      '/api/v1/auth/confirm-password-reset',
      '/api/v1/auth/verify-email',
      '/api/v1/auth/resend-verification',
      '/api/v1/auth/mfa/challenge',
      '/api/v1/auth/mfa/backup-codes/consume',
      '/api/v1/auth/google',
      '/api/v1/auth/google/callback',
      '/api/v1/auth/github',
      '/api/v1/auth/github/callback',
      '/api/v1/account/change-password',
      '/api/v1/account/delete-account',
    ];

    return !excludedEndpoints.some(endpoint => url.startsWith(endpoint));
  }
}