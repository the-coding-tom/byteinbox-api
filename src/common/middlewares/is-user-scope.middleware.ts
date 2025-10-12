import { Injectable, NestMiddleware, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './is-authenticated.middleware';

/**
 * Middleware to require user-only access (no API keys)
 * Use this for endpoints like user profile, settings, account management, etc.
 */
@Injectable()
export class IsUserScopeMiddleware implements NestMiddleware {
  use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    if (req.authType !== 'jwt') {
      throw new ForbiddenException('This endpoint requires user authentication');
    }

    if (!req.user) {
      throw new UnauthorizedException('User not found in request');
    }

    next();
  }
}

