import { Injectable, NestMiddleware, HttpStatus } from '@nestjs/common';
import { Response, NextFunction } from 'express';
import { UserType } from '@prisma/client';
import { throwError } from '../../utils/util';
import { logError } from '../../utils/logger';

@Injectable()
export class IsAdminMiddleware implements NestMiddleware {
  use(req: any, res: Response, next: NextFunction) {
    try {
      // Validate user exists in request
      const user = req.user;

      if (!user) {
        throwError('Authentication required', HttpStatus.UNAUTHORIZED, 'authenticationRequired');
      }

      // Check if user has admin role
      const isAdmin = user.userType === UserType.ADMIN;

      if (!isAdmin) {
        throwError('Admin access required', HttpStatus.FORBIDDEN, 'adminAccessRequired');
      }

      next();
    } catch (error) {
      logError(`Unexpected error in admin middleware: ${error.message}`);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Internal server error',
        errorCode: 'serverError',
      });
    }
  }
}
