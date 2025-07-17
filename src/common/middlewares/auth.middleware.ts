import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';

import { VALIDATION_MESSAGES } from '../constants/validation.constant';

// Interface for authenticated requests
export interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
    role?: string;
  };
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private jwtService: JwtService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Check if route is public (no auth required)
    if (this.isPublicRoute(req.path)) {
      return next();
    }

    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException(VALIDATION_MESSAGES.AUTHORIZATION_TOKEN_REQUIRED);
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    try {
      // Verify JWT token using JwtService
      const payload = this.jwtService.verify(token);

      // Attach user info to request for use in controllers/services
      (req as AuthenticatedRequest).user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };

      next();
    } catch (error) {
      throw new UnauthorizedException(VALIDATION_MESSAGES.INVALID_OR_EXPIRED_TOKEN);
    }
  }

  private isPublicRoute(path: string): boolean {
    const publicRoutes = [
      '/api/v1/auth/login',
      '/api/v1/auth/register',
      '/api/v1/auth/oauth/login',
      '/api/v1/auth/oauth/:provider/url',
      '/api/v1/auth/callback',
      '/api/v1/auth/refresh',
      '/api/v1/auth/forgot-password',
      '/api/v1/auth/reset-password',
      '/api/v1/auth/verify-email',
      '/api/v1/auth/resend-verification',
      '/api/v1/otp/verify/email',
      '/api/v1/otp/verify/sms',
      '/api/v1/otp/verify/totp',
    ];

    // Check exact matches first
    if (publicRoutes.includes(path)) {
      return true;
    }

    // Check pattern matches (for routes with parameters)
    return publicRoutes.some(route => {
      const routePattern = route.replace(/:[^/]+/g, '[^/]+');
      const regex = new RegExp(`^${routePattern}$`);
      return regex.test(path);
    });
  }
}
