import { Injectable, NestMiddleware, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response, NextFunction } from 'express';
import { throwError } from '../../utils/util';
import { logError } from '../../utils/logger';
import { VALIDATION_MESSAGES } from '../constants/validation.constant';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private jwtService: JwtService) {}

  // MIDDLEWARE EXECUTION

  use(req: any, res: Response, next: NextFunction) {
    try {
      // Extract and validate authorization header
      const authHeader = req.headers.authorization;

      if (!authHeader?.startsWith('Bearer ')) {
        throwError(
          VALIDATION_MESSAGES.AUTHORIZATION_TOKEN_REQUIRED,
          HttpStatus.UNAUTHORIZED,
          'authorizationTokenRequired',
        );
      }

      // Extract token from Bearer format
      const token = authHeader!.substring(7); // Remove "Bearer " prefix

      // Verify JWT token and extract payload
      const payload = this.jwtService.verify(token);

      // Attach user info to request for use in controllers/services
      const user = {
        id: payload.sub,
        email: payload.email,
        userType: payload.userType,
        status: payload.status,
        isEmailVerified: payload.isEmailVerified,
      };

      req.user = user;

      next();
    } catch (error) {
      logError(`Unexpected error in auth middleware: ${error.message}`);
      return res.status(HttpStatus.UNAUTHORIZED).json({
        message: VALIDATION_MESSAGES.INVALID_OR_EXPIRED_TOKEN,
        errorCode: 'invalidOrExpiredToken',
      });
    }
  }
}
