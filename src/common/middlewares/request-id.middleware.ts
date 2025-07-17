import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Generate unique request ID
    const requestId = uuidv4();

    // Add request ID to request object for use in controllers/services
    (req as any).requestId = requestId;

    // Add request ID to response headers for tracing
    res.setHeader('X-Request-ID', requestId);

    next();
  }
}
