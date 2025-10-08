import { Injectable } from '@nestjs/common';
import prisma from '../common/prisma';

@Injectable()
export class SessionRepository {
  // Session/Refresh token methods
  // Note: refreshToken model no longer exists, using Session model instead
  async createRefreshToken(refreshTokenData: any): Promise<any> {
    return prisma.session.create({
      data: {
        userId: refreshTokenData.userId,
        refreshToken: refreshTokenData.token, // Field is refreshToken in Session model
        expiresAt: refreshTokenData.expiresAt,
        userAgent: refreshTokenData.userAgent,
        ipAddress: refreshTokenData.ipAddress,
      },
    });
  }

  async findRefreshToken(token: string): Promise<any | null> {
    return prisma.session.findFirst({
      where: {
        refreshToken: token,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
  }

  async revokeRefreshToken(token: string): Promise<void> {
    // In new schema, we delete the session to revoke it
    await prisma.session.deleteMany({
      where: { refreshToken: token },
    });
  }

  async revokeAllUserRefreshTokens(userId: number): Promise<void> {
    // Delete all sessions for the user
    await prisma.session.deleteMany({
      where: { userId },
    });
  }

  async cleanupExpiredTokens(): Promise<void> {
    await prisma.$queryRaw`
      DELETE FROM sessions 
      WHERE expires_at < NOW()
    `;
  }

  // Session management methods
  async getActiveSessions(userId: number): Promise<any[]> {
    const sessions = await prisma.session.findMany({
      where: {
        userId,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return sessions.map(session => ({
      id: session.id,
      token: session.refreshToken,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
    }));
  }

  async revokeAllSessions(userId: number): Promise<void> {
    await prisma.session.deleteMany({
      where: { userId },
    });
  }

  // Security activity methods
  async getSecurityActivity(userId: number): Promise<any[]> {
    // Get recent sessions as security activity
    const sessions = await prisma.session.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return sessions.map(session => ({
      id: session.id,
      userId: session.userId,
      activity: 'login',
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      createdAt: session.createdAt,
    }));
  }
} 