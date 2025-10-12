import { Injectable, NestMiddleware, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ApiKeyRepository } from '../../repositories/api-key.repository';
import prisma from '../prisma';

/**
 * Extended request with injected auth data
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    [key: string]: any;
  };
  teamId: number;
  apiKeyId?: number; // Only present for API key requests
  authType: 'jwt' | 'api_key';
  userRole?: string; // Team member role (only for JWT users, undefined for API keys)
}

/**
 * Combined authentication middleware
 * Handles both JWT (user auth) and API keys
 * Automatically detects type and validates accordingly
 */
@Injectable()
export class IsAuthenticatedMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly apiKeyRepository: ApiKeyRepository,
  ) {}

  async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('Authorization token required');
      }

      const token = authHeader.substring(7); // Remove 'Bearer '

      // Detect token type by prefix
      if (token.startsWith('byt_')) {
        // API Key flow
        await this.handleApiKey(req, token);
      } else {
        // JWT flow
        await this.handleJWT(req, token);
      }

      next();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle API Key authentication
   */
  private async handleApiKey(req: AuthenticatedRequest, apiKey: string) {
    // Validate API key format
    if (!apiKey.startsWith('byt_') || apiKey.length < 68) {
      throw new UnauthorizedException('Invalid API key format');
    }

    // Validate API key from database
    const keyData = await this.apiKeyRepository.findByKeyWithRelations(apiKey);

    if (!keyData) {
      throw new UnauthorizedException('Invalid API key');
    }

    if (keyData.status !== 'active') {
      throw new UnauthorizedException('API key is not active');
    }

    // Check expiration
    if (keyData.expiresAt && new Date(keyData.expiresAt) < new Date()) {
      throw new UnauthorizedException('API key has expired');
    }

    // Get teamId from x-team-id header (required for API keys)
    const headerTeamId = req.headers['x-team-id'] as string;
    
    if (!headerTeamId) {
      throw new UnauthorizedException('x-team-id header required');
    }

    const teamIdNum = parseInt(headerTeamId);
    if (isNaN(teamIdNum) || teamIdNum <= 0) {
      throw new UnauthorizedException('Invalid x-team-id format');
    }

    // Validate teamId matches the API key's team
    if (teamIdNum !== keyData.teamId) {
      throw new ForbiddenException('x-team-id does not match API key team');
    }

      // Inject into request
      req.authType = 'api_key';
      req.teamId = keyData.teamId;
      req.apiKeyId = keyData.id;
      req.user = undefined; // No user for API keys
      req.userRole = undefined; // API keys have full access, no role restrictions

    // Update last used timestamp (fire and forget)
    this.apiKeyRepository.updateLastUsed(keyData.id).catch(() => {});
  }

  /**
   * Handle JWT authentication
   */
  private async handleJWT(req: AuthenticatedRequest, token: string) {
    try {
      // Verify JWT
      const decoded = this.jwtService.verify(token);

      // Get teamId from x-team-id header (required for JWT)
      const teamIdHeader = req.headers['x-team-id'] as string;

      if (!teamIdHeader) {
        throw new UnauthorizedException('x-team-id header required');
      }

      const teamId = parseInt(teamIdHeader);
      if (isNaN(teamId) || teamId <= 0) {
        throw new UnauthorizedException('Invalid x-team-id format');
      }

      // Verify team exists
      const team = await prisma.team.findUnique({
        where: { id: teamId }
      });

      if (!team) {
        throw new ForbiddenException('Team not found');
      }

      // Verify user has access to this team and get role
      const member = await prisma.teamMember.findFirst({
        where: {
          userId: decoded.sub,
          teamId: teamId,
        }
      });

      if (!member) {
        throw new ForbiddenException('You do not have access to this team');
      }

      // Inject into request
      req.authType = 'jwt';
      req.user = {
        id: decoded.sub,
        email: decoded.email,
        ...decoded, // Include any other JWT claims
      };
      req.teamId = teamId;
      req.apiKeyId = undefined;
      req.userRole = member.role; // Inject team member role for validators

    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token');
      }
      throw error;
    }
  }
}
