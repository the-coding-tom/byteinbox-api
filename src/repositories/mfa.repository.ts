import { Injectable } from '@nestjs/common';
import { MfaMethod } from '@prisma/client';
import prisma from '../common/prisma';

@Injectable()
export class MfaRepository {
  // MFA Verification Session methods
  async createMfaSession(mfaSessionData: { sessionToken: string; userId: number; email: string; mfaMethod: MfaMethod; isVerified: boolean; expiresAt: Date }): Promise<any> {
    return prisma.mfaVerificationSession.create({
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
    return prisma.mfaVerificationSession.findFirst({
      where: {
        sessionToken,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
  }

  async markMfaSessionAsVerified(sessionToken: string): Promise<void> {
    await prisma.mfaVerificationSession.updateMany({
      where: { sessionToken },
      data: { isVerified: true },
    });
  }

  async cleanupExpiredMfaSessions(): Promise<void> {
    await prisma.$queryRaw`
      DELETE FROM mfa_verification_sessions 
      WHERE expires_at < NOW()
    `;
  }

  async getRecentMfaSessions(userId: number, minutes: number): Promise<any[]> {
    return prisma.mfaVerificationSession.findMany({
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
    return prisma.mfaVerificationSession.findFirst({
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

  // Recovery Session methods - Using VerificationRequest as proxy
  // Note: recoverySession model doesn't exist in new schema
  async createRecoverySession(recoveryToken: string, userId: number, expiresAt: Date): Promise<any> {
    // Use VerificationRequest with PASSWORD_RESET type as proxy
    return prisma.verificationRequest.create({
      data: {
        email: '', // Will be filled by caller
        token: recoveryToken,
        type: 'PASSWORD_RESET',
        expiresAt,
      },
    });
  }

  async getRecoverySession(recoveryToken: string): Promise<any | null> {
    // Use VerificationRequest as proxy
    const verificationRequest = await prisma.verificationRequest.findFirst({
      where: {
        token: recoveryToken,
        type: 'PASSWORD_RESET',
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!verificationRequest) return null;

    // Return in expected format
    return {
      recoveryToken: verificationRequest.token,
      isUsed: false, // VerificationRequest doesn't track usage
      expiresAt: verificationRequest.expiresAt,
      user: null, // No direct user relation
    };
  }

  async deleteRecoverySession(recoveryToken: string): Promise<void> {
    await prisma.verificationRequest.deleteMany({
      where: { 
        token: recoveryToken,
        type: 'PASSWORD_RESET',
      },
    });
  }

  async markRecoverySessionAsUsed(recoveryToken: string): Promise<void> {
    // VerificationRequest doesn't have isUsed field, so we delete it
    await this.deleteRecoverySession(recoveryToken);
  }

  async cleanupExpiredRecoverySessions(): Promise<void> {
    await prisma.verificationRequest.deleteMany({
      where: {
        type: 'PASSWORD_RESET',
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
} 