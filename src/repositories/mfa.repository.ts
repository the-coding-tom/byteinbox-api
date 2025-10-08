import { Injectable } from '@nestjs/common';
import prisma from '../common/prisma';

@Injectable()
export class MfaRepository {
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

  async cleanupExpiredMfaSessions(): Promise<void> {
    await prisma.$queryRaw`
      DELETE FROM mfa_verification_sessions
      WHERE expires_at < NOW()
    `;
  }
} 