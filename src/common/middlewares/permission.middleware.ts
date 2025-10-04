import { Injectable, NestMiddleware, HttpStatus } from '@nestjs/common';
import { Response, NextFunction } from 'express';

import { PermissionName } from '@prisma/client';
import { PermissionRepository } from '../../repositories/permission.repository';
import { throwError } from '../../utils/util';
import { logError } from '../../utils/logger';

@Injectable()
export class PermissionMiddleware implements NestMiddleware {
  constructor(private permissionRepository: PermissionRepository) {}

  async use(req: any, res: Response, next: NextFunction) {
    try {
      // Extract user and required permission from request
      const user = req.user;
      const requiredPermission = req.route?.metadata?.permission as PermissionName;

      // Validate user authentication
      if (!user) {
        throwError('Authentication required', HttpStatus.UNAUTHORIZED, 'authenticationRequired');
      }

      // Check permission if required
      if (requiredPermission) {
        const hasPermission = await this.permissionRepository.hasPermission(
          user.id,
          requiredPermission,
        );

        if (!hasPermission) {
          throwError('Insufficient permissions', HttpStatus.FORBIDDEN, 'insufficientPermissions');
        }
      }

      next();
    } catch (error) {
      logError(`Unexpected error in permission middleware: ${error.message}`);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Internal server error',
        errorCode: 'serverError',
      });
    }
  }
}
