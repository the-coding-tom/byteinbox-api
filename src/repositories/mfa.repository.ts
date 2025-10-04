import { Injectable } from '@nestjs/common';
import { MfaMethod, OtpRequestStatus } from '@prisma/client';
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

  // OTP Request methods
  async createOtpRequest(otpRequestData: { userId: number; sessionToken: string; mfaMethod: MfaMethod; otpCode: string; otpExpiresAt: Date; status: OtpRequestStatus; ipAddress: string; userAgent: string }): Promise<any> {
    return prisma.otpRequest.create({
      data: {
        userId: otpRequestData.userId,
        sessionToken: otpRequestData.sessionToken,
        mfaMethod: otpRequestData.mfaMethod,
        otpCode: otpRequestData.otpCode,
        otpExpiresAt: otpRequestData.otpExpiresAt,
        status: otpRequestData.status,
        ipAddress: otpRequestData.ipAddress,
        userAgent: otpRequestData.userAgent,
      },
    });
  }

  async getRecentOtpRequests(userId: number, mfaMethod: MfaMethod, hours: number = 24): Promise<any[]> {
    return prisma.otpRequest.findMany({
      where: {
        userId,
        mfaMethod,
        createdAt: {
          gte: new Date(Date.now() - hours * 60 * 60 * 1000),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async expireOtpRequests(): Promise<number> {
    const result = await prisma.otpRequest.updateMany({
      where: {
        otpExpiresAt: {
          lt: new Date(),
        },
        status: 'PENDING',
      },
      data: {
        status: 'EXPIRED',
      },
    });
    return result.count;
  }

  async cleanupOldOtpRequests(days: number = 30): Promise<void> {
    await prisma.otpRequest.deleteMany({
      where: {
        createdAt: {
          lt: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        },
      },
    });
  }

  async markOtpRequestAsSuccessful(userId: number, mfaMethod: MfaMethod, otpCode: string): Promise<void> {
    await prisma.otpRequest.updateMany({
      where: {
        userId,
        mfaMethod,
        otpCode,
        status: 'PENDING',
      },
      data: {
        status: 'VERIFIED',
      },
    });
  }

  async findOtpRequestByCode(userId: number, mfaMethod: MfaMethod, otpCode: string): Promise<any | null> {
    return prisma.otpRequest.findFirst({
      where: {
        userId,
        mfaMethod,
        otpCode,
        status: 'PENDING',
        otpExpiresAt: {
          gt: new Date(),
        },
      },
    });
  }

  async getOtpRequestsBySession(sessionToken: string): Promise<any[]> {
    return prisma.otpRequest.findMany({
      where: {
        sessionToken,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getRecentFailedOtpRequests(userId: number, hours: number): Promise<any[]> {
    return prisma.otpRequest.findMany({
      where: {
        userId,
        status: 'FAILED',
        createdAt: {
          gte: new Date(Date.now() - hours * 60 * 60 * 1000),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // MFA User lookup methods
  async findUserByEmailOtp(email: string, otp: string): Promise<any | null> {
    // First find the user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    // Then find the OTP request for that user
    const otpRequest = await prisma.otpRequest.findFirst({
      where: {
        userId: user.id,
        otpCode: otp,
        otpExpiresAt: {
          gt: new Date(),
        },
        status: 'PENDING',
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return otpRequest?.user || null;
  }

  // OTP Rate limiting methods
  async getOtpRateLimit(userId: number, mfaMethod: MfaMethod): Promise<any | null> {
    return prisma.otpRateLimit.findFirst({
      where: {
        userId,
        mfaMethod,
      },
    });
  }

  async createOrUpdateOtpRateLimit(rateLimitData: { userId: number; mfaMethod: MfaMethod; attemptCount: number }): Promise<any> {
    return prisma.otpRateLimit.upsert({
      where: {
        userId_mfaMethod: {
          userId: rateLimitData.userId,
          mfaMethod: rateLimitData.mfaMethod,
        },
      },
      update: {
        attemptCount: rateLimitData.attemptCount,
        lastAttemptAt: new Date(),
      },
      create: {
        userId: rateLimitData.userId,
        mfaMethod: rateLimitData.mfaMethod,
        attemptCount: rateLimitData.attemptCount,
        lastAttemptAt: new Date(),
      },
    });
  }

  async deleteAllOtpRateLimitsForUser(userId: number): Promise<void> {
    await prisma.otpRateLimit.deleteMany({
      where: { userId },
    });
  }

  async cleanupExpiredRateLimits(): Promise<void> {
    // Since there's no expiresAt field, we'll just clean up old rate limits
    await prisma.otpRateLimit.deleteMany({
      where: {
        createdAt: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Delete rate limits older than 24 hours
        },
      },
    });
  }

  // Email OTP Verification methods
  async verifyEmailOtp(sessionToken: string, otpCode: string): Promise<boolean> {
    const otpRequest = await prisma.otpRequest.findFirst({
      where: {
        sessionToken,
        otpCode,
        mfaMethod: 'EMAIL',
        status: 'PENDING',
        otpExpiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!otpRequest) {
      return false;
    }

    // Mark as verified
    await prisma.otpRequest.update({
      where: { id: otpRequest.id },
      data: { status: 'VERIFIED' },
    });

    return true;
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