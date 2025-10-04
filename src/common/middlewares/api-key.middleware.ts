import { Injectable, NestMiddleware, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ApiKeyRepository } from '../../repositories/api-key.repository';
import { throwError } from '../../utils/util';
import { logError } from '../../utils/logger';

// Interface for requests with API key
export interface ApiKeyRequest extends Request {
  apiKey: {
    id: number;
    userId: number;
    scopes: string[];
    name: string;
  };
}

@Injectable()
export class ApiKeyMiddleware implements NestMiddleware {
  constructor(private readonly apiKeyRepository: ApiKeyRepository) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // Extract API key from headers
      const apiKey = req.headers['x-api-key'] as string;

      if (apiKey) {
        // Find and validate API key
        const keyEntity = await this.apiKeyRepository.findByKey(apiKey);
        if (!keyEntity) {
          throwError('Invalid API key', HttpStatus.UNAUTHORIZED, 'invalidApiKey');
        }

        // Check if API key is active and not expired
        if (!keyEntity.isActive || (keyEntity.expiresAt && new Date() > keyEntity.expiresAt)) {
          throwError('API key is inactive or expired', HttpStatus.UNAUTHORIZED, 'apiKeyInactive');
        }

        // Update last used timestamp
        await this.apiKeyRepository.updateLastUsed(keyEntity.id);

        // Attach API key info to request
        (req as ApiKeyRequest).apiKey = {
          id: keyEntity.id,
          userId: keyEntity.userId,
          scopes: keyEntity.scopes,
          name: keyEntity.name,
        };
      }

      next();
    } catch (error) {
      logError(`Unexpected error in API key middleware: ${error.message}`);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Internal server error',
        errorCode: 'serverError',
      });
    }
  }
}
