import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

import { logRequest, logResponse } from '../../utils/logger';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();

    // Log incoming request
    logRequest(req);

    // Listen for response finish event to capture response time and status
    res.on('finish', () => {
      const duration = Date.now() - startTime;

      // Log outgoing response
      logResponse(req, res, duration);
    });

    next();
  }
}
