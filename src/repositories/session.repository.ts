import { Injectable } from '@nestjs/common';
import prisma from '../common/prisma';

@Injectable()
export class SessionRepository {
  // Refresh token methods
  async createRefreshToken(refreshTokenData: any): Promise<any> {
    return prisma.refreshToken.create({
      data: {
        userId: refreshTokenData.userId,
        token: refreshTokenData.token,
        expiresAt: refreshTokenData.expiresAt,
        isRevoked: refreshTokenData.isRevoked,
      },
    });
  }

  async findRefreshToken(token: string): Promise<any | null> {
    return prisma.refreshToken.findFirst({
      where: {
        token,
        expiresAt: {
          gt: new Date(),
        },
        isRevoked: false,
      },
    });
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { token },
      data: { isRevoked: true },
    });
  }

  async revokeAllUserRefreshTokens(userId: number): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });
  }

  async cleanupExpiredTokens(): Promise<void> {
    await prisma.$queryRaw`
      DELETE FROM refresh_tokens 
      WHERE expires_at < NOW() OR is_revoked = true
    `;
  }

  // Session management methods
  async getActiveSessions(userId: number): Promise<any[]> {
    const sessions = await prisma.$queryRaw<any[]>`
      SELECT 
        rt.id,
        rt.token,
        rt.created_at as createdAt,
        rt.expires_at as expiresAt,
        rt.user_agent,
        rt.ip_address as ipAddress
      FROM refresh_tokens rt
      WHERE rt.user_id = ${userId}
      AND rt.expires_at > NOW()
      AND rt.is_revoked = false
      ORDER BY rt.created_at DESC
    `;
    return sessions;
  }

  async revokeAllSessions(userId: number): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });
  }

  // Security activity methods
  async getSecurityActivity(userId: number): Promise<any[]> {
    // This would typically query a security_activity table
    // For now, returning a placeholder structure
    return [
      {
        id: 1,
        userId,
        activity: 'login',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        createdAt: new Date(),
      },
    ];
  }
} 