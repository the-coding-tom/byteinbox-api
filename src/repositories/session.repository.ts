import { Injectable } from '@nestjs/common';
import prisma from '../common/prisma';

@Injectable()
export class SessionRepository {
  async createSession(sessionData: any): Promise<any> {
    return prisma.session.create({
      data: {
        userId: sessionData.userId,
        refreshToken: sessionData.token,
        expiresAt: sessionData.expiresAt,
        userAgent: sessionData.userAgent,
        ipAddress: sessionData.ipAddress,
      },
    });
  }

  async getSessionsByUserId(userId: number): Promise<any[]> {
    return prisma.session.findMany({
      where: { userId },
    });
  }

  async findSessionByRefreshToken(token: string): Promise<any | null> {
    return prisma.session.findFirst({
      where: {
        refreshToken: token
      },
    });
  }

  async deleteSessionByRefreshToken(token: string): Promise<void> {
    await prisma.session.deleteMany({
      where: { refreshToken: token },
    });
  }

  async revokeAllUserRefreshTokens(userId: number): Promise<void> {
    await prisma.session.deleteMany({
      where: { userId },
    });
  }

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

  async deleteAllUserSessionsByuserId(userId: number): Promise<void> {
    await prisma.session.deleteMany({
      where: { userId },
    });
  }
} 