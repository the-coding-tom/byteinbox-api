import { Injectable } from '@nestjs/common';
import { MfaMethod } from '@prisma/client';
import prisma from '../common/prisma';

@Injectable()
export class MfaRepository {
  // MFA Session methods
  async createMfaSession(mfaSessionData: { sessionToken: string; userId: number; email: string; mfaMethod: MfaMethod; isVerified: boolean; expiresAt: Date }): Promise<any> {
    return prisma.mfaSession.create({
      data: {
        sessionToken: mfaSessionData.sessionToken,
        userId: mfaSessionData.userId,
        email: mfaSessionData.email,
        mfaMethod: mfaSessionData.mfaMethod,
        isVerified: mfaSessionData.isVerified,
        expiresAt: mfaSessionData.expiresAt,
      },
    });
  }

  async findMfaSessionByToken(sessionToken: string): Promise<any | null> {
    return prisma.mfaSession.findFirst({
      where: {
        sessionToken,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
  }

  async markMfaSessionAsVerified(sessionToken: string): Promise<void> {
    await prisma.mfaSession.updateMany({
      where: { sessionToken },
      data: { isVerified: true },
    });
  }

  async cleanupExpiredMfaSessions(): Promise<void> {
    await prisma.$queryRaw`
      DELETE FROM mfa_sessions 
      WHERE expires_at < NOW()
    `;
  }

  async getRecentMfaSessions(userId: number, minutes: number): Promise<any[]> {
    return prisma.mfaSession.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - minutes * 60 * 1000),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }


  async getSessionByToken(sessionToken: string): Promise<any | null> {
    return prisma.mfaSession.findFirst({
      where: {
        sessionToken,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });
  }

  // Recovery Session methods
  async createRecoverySession(recoveryToken: string, userId: number, expiresAt: Date): Promise<any> {
    return prisma.recoverySession.create({
      data: {
        recoveryToken,
        userId,
        expiresAt,
      },
    });
  }

  async getRecoverySession(recoveryToken: string): Promise<any | null> {
    return prisma.recoverySession.findFirst({
      where: {
        recoveryToken,
        isUsed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });
  }

  async deleteRecoverySession(recoveryToken: string): Promise<void> {
    await prisma.recoverySession.deleteMany({
      where: { recoveryToken },
    });
  }

  async markRecoverySessionAsUsed(recoveryToken: string): Promise<void> {
    await prisma.recoverySession.updateMany({
      where: { recoveryToken },
      data: { isUsed: true },
    });
  }

  async cleanupExpiredRecoverySessions(): Promise<void> {
    await prisma.recoverySession.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
} 