import { Injectable } from '@nestjs/common';
import prisma from '../common/prisma';
import { CreateSessionData } from './entities/session.entity';

@Injectable()
export class SessionRepository {
  async createSession(sessionData: CreateSessionData): Promise<any> {
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

  async deleteAllUserSessionsByuserId(userId: number): Promise<void> {
    await prisma.session.deleteMany({
      where: { userId },
    });
  }
} 