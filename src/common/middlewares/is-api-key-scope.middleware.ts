import { Injectable, NestMiddleware, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './is-authenticated.middleware';

/**
 * Middleware to require API key-only access (no JWT)
 * Use this for endpoints that should only be accessed via API keys
 * 
 * @example
 * // In your module:
 * export class AppModule implements NestModule {
 *   configure(consumer: MiddlewareConsumer) {
 *     consumer
 *       .apply(IsAuthenticatedMiddleware, IsApiKeyScopeMiddleware)
 *       .forRoutes('/api/v1/webhooks/receive');
 *   }
 * }
 */
@Injectable()
export class IsApiKeyScopeMiddleware implements NestMiddleware {
  use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    if (req.authType !== 'api_key') {
      throw new ForbiddenException('This endpoint requires API key authentication');
    }

    if (!req.apiKeyId) {
      throw new UnauthorizedException('API key not found in request');
    }

    next();
  }
}

