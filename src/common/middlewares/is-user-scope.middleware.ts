import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/request.types';

/**
 * User Scope middleware
 * Ensures that only JWT-authenticated users can access these endpoints
 * Validates that the team is the user's personal team
 */
@Injectable()
export class IsUserScopeMiddleware implements NestMiddleware {
  async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    // Check if request is authenticated via JWT (not API key)
    if (req.authType !== 'jwt') {
      throw new UnauthorizedException('This endpoint requires user authentication (JWT), not API key access');
    }

    next();
  }
}
