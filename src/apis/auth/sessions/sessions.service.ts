import { Injectable, HttpStatus } from '@nestjs/common';
import { SessionRepository } from '../../../repositories/session.repository';
import { SessionsValidator } from './sessions.validator';
import { generateSuccessResponse } from '../../../utils/util';
import { handleServiceError } from '../../../utils/error.util';

@Injectable()
export class SessionsService {
  constructor(
    private sessionRepository: SessionRepository,
    private sessionsValidator: SessionsValidator,
  ) {}

  async getActiveSessions(userId: number): Promise<any> {
    try {
      // Validate user
      await this.sessionsValidator.validateGetActiveSessions(userId);

      // Get active sessions
      const sessions = await this.sessionRepository.getActiveSessions(userId);

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'Active sessions retrieved successfully',
        data: {
          sessions: sessions.map(session => ({
            id: session.id,
            createdAt: session.createdAt,
            expiresAt: session.expiresAt,
            isRevoked: session.isRevoked,
            userAgent: session.userAgent || 'Unknown',
            ipAddress: session.ipAddress || 'Unknown',
          })),
          totalCount: sessions.length,
        },
      });
    } catch (error) {
      return handleServiceError('Error retrieving active sessions', error);
    }
  }

  async revokeAllSessions(userId: number): Promise<any> {
    try {
      // Validate user
      await this.sessionsValidator.validateRevokeAllSessions(userId);

      // Revoke all user sessions
      await this.sessionRepository.revokeAllUserRefreshTokens(userId);

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'All sessions revoked successfully',
      });
    } catch (error) {
      return handleServiceError('Error revoking sessions', error);
    }
  }
} 