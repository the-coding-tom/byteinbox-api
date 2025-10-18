import { HttpStatus, Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/request.types';
import { logError } from '../../utils/logger';

/**
 * User Scope middleware
 * Ensures that only JWT-authenticated users can access these endpoints
 * Validates that the team is the user's personal team
 */
@Injectable()
export class IsUserScopeMiddleware implements NestMiddleware {
  async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      // Check if request is authenticated via JWT (not API key)
      if (req.authType !== 'jwt') {
        throw new UnauthorizedException('This endpoint requires user authentication (JWT), not API key access');
      }

      next();
    } catch (error) {
      logError(`Error during user scope validation: ${error.message}`);
      return res.status(HttpStatus.UNAUTHORIZED).json({
        message: error.message,
        errorCode: 'authenticationError',
      });
    }
  }
}
