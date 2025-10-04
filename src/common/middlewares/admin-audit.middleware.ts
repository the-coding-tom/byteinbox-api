import { Injectable, NestMiddleware } from '@nestjs/common';
import { Response, NextFunction } from 'express';

@Injectable()
export class AdminAuditMiddleware implements NestMiddleware {
  use(request: any, response: Response, next: NextFunction) {
    // Extract request information for audit logging
    const user = request.user;
    const method = request.method;
    const requestUrl = request.url;
    const ipAddress = request.ip;
    const userAgent = request.headers['user-agent'];

    // Log admin action if user exists
    if (user) {
      const adminAction = {
        timestamp: new Date().toISOString(),
        adminId: user.id,
        adminEmail: user.email,
        action: `${method} ${requestUrl}`,
        ipAddress: ipAddress,
        userAgent: userAgent,
        requestBody: method !== 'GET' ? request.body : undefined,
      };

      // Log to console for now - in production, you might want to log to a file or database
      console.log('🔍 Admin Action:', JSON.stringify(adminAction, null, 2));
      
      // You could also store this in a database table for audit purposes
      // await this.auditRepository.create(adminAction);
    }

    next();
  }
} 