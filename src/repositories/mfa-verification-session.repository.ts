import { Injectable } from '@nestjs/common';
import prisma from '../common/prisma';

@Injectable()
export class MfaVerificationSessionRepository {
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

  async markExpiredSessionsAsExpired(): Promise<void> {
    await prisma.$queryRaw`
      UPDATE mfa_verification_sessions
      SET status = 'expired'::"MfaVerificationSessionStatus"
      WHERE 
        expires_at < NOW()
        AND status::"MfaVerificationSessionStatus" != 'expired'::"MfaVerificationSessionStatus"
    `;
  }
} 