import { HttpStatus, Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ApiKeyRepository } from '../../repositories/api-key.repository';
import * as moment from 'moment';
import { ApiKeyStatus } from '@prisma/client';
import { logError } from '../../utils/logger';
import prisma from '../prisma';
import { AuthenticatedRequest } from '../types/request.types';


/**
 * Authentication middleware
 * Validates tokens and injects user and team objects
 */
@Injectable()
export class IsAuthenticatedMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly apiKeyRepository: ApiKeyRepository,
  ) { }

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
      logError(`Error during authentication: ${error.message}`);
      return res.status(HttpStatus.UNAUTHORIZED).json({
        message: error.message,
        errorCode: 'authenticationError',
      });
    }
  }

  /**
   * Handle API Key authentication - validates token and injects user and team
   */
  private async handleApiKey(req: AuthenticatedRequest, apiKey: string) {
    // Validate API key from database
    const apiKeyData = await this.apiKeyRepository.findByKeyWithRelations(apiKey);
    if (!apiKeyData) {
      throw new UnauthorizedException('Invalid API key');
    }

    if (apiKeyData.status !== ApiKeyStatus.active) {
      throw new UnauthorizedException('API key is not active');
    }

    // Check expiration
    if (apiKeyData.expiresAt && moment(apiKeyData.expiresAt).isBefore(moment())) {
      throw new UnauthorizedException('API key has expired');
    }

    // Get team from API key (API key is tied to a specific team)
    const team = await prisma.team.findUnique({
      where: { id: apiKeyData.teamId },
    });
    if (!team) {
      throw new UnauthorizedException('Team not found');
    }

    // Get user who created the API key (if available)
    const user = await prisma.user.findUnique({
      where: { id: apiKeyData.createdBy },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }


    // Inject auth data and objects into request
    req.authType = 'api_key';
    req.userId = user.id;
    req.teamId = team.id;
    
    // Inject user object
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name || '',
      status: user.status,
      photoUrl: user.photoUrl || undefined,
    };
    
    // Inject team object
    req.team = {
      id: team.id,
      reference: team.reference,
      name: team.name,
      slug: team.slug,
    };
    
    // Update last used timestamp (fire and forget)
    this.apiKeyRepository.updateLastUsed(apiKeyData.id).catch(() => { });
  }

  /**
   * Handle JWT authentication - validates token and user status
   */
  private async handleJWT(req: AuthenticatedRequest, token: string) {
    // Verify JWT
    const decoded = this.jwtService.verify(token);

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check user status
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User account is not active');
    }

    // For JWT, inject user object and optionally team object
    req.authType = 'jwt';
    req.userId = user.id;
    
    // Always inject user object
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name || '',
      status: user.status,
      photoUrl: user.photoUrl || undefined,
    };
    
    // Always require team header for JWT requests
    const teamHeader = req.headers['x-byteinbox-team'] as string;
    if (!teamHeader) {
      throw new UnauthorizedException('x-byteinbox-team header is required');
    }

    // Get team from database by reference
    const team = await prisma.team.findUnique({
      where: { reference: teamHeader },
    });

    if (!team) {
      throw new UnauthorizedException('Team not found');
    }

    // Verify user has access to this team
    const member = await prisma.teamMember.findFirst({
      where: {
        userId: user.id,
        teamId: team.id,
      }
    });

    if (!member) {
      throw new UnauthorizedException('You do not have access to this team');
    }

    // Set team context
    req.teamId = team.id;
    req.team = {
      id: team.id,
      reference: team.reference,
      name: team.name,
      slug: team.slug,
    };
  }
}