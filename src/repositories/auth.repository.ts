import { Injectable } from '@nestjs/common';
import { User, RefreshToken, MfaMethod } from '@prisma/client';

import prisma from '../common/prisma';
import { refreshTokenToDatabase } from '../helpers/refresh-token.helper';
import { toDatabase } from '../helpers/user.helper';

import { RefreshTokenEntity } from './entities/refresh-token.entity';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class AuthRepository {
  // User management methods
  async findUserByEmail(email: string): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    return user ? (user as UserEntity) : null;
  }

  async findUserById(id: number): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    return user ? (user as UserEntity) : null;
  }

  async findUserByOAuth(oauthProvider: string, oauthId: string): Promise<UserEntity | null> {
    const user = await prisma.user.findFirst({
      where: {
        oauthProvider,
        oauthId,
      },
    });
    return user ? (user as UserEntity) : null;
  }

  async createUser(userEntity: UserEntity): Promise<UserEntity> {
    const user = await prisma.user.create({
      data: toDatabase(userEntity),
    });
    return user as UserEntity;
  }

  async updateUser(userEntity: UserEntity): Promise<UserEntity> {
    const user = await prisma.user.update({
      where: { id: userEntity.id },
      data: toDatabase(userEntity),
    });
    return user as UserEntity;
  }

  async updateUserById(id: number, userEntity: UserEntity): Promise<UserEntity> {
    const user = await prisma.user.update({
      where: { id },
      data: toDatabase(userEntity),
    });
    return user as UserEntity;
  }

  async deleteUser(id: number): Promise<void> {
    await prisma.$queryRaw`
      DELETE FROM users WHERE id = ${id}
    `;
  }

  // Email verification methods
  async findUserByEmailVerificationToken(token: string): Promise<UserEntity | null> {
    const users = await prisma.$queryRaw<User[]>`
      SELECT * FROM users 
      WHERE email_verification_token = ${token}
      AND email_verification_expires_at > NOW()
      LIMIT 1
    `;
    return users[0] ? (users[0] as UserEntity) : null;
  }

  // Password reset methods
  async findUserByPasswordResetToken(token: string): Promise<UserEntity | null> {
    const users = await prisma.$queryRaw<User[]>`
      SELECT * FROM users 
      WHERE password_reset_token = ${token}
      AND password_reset_expires_at > NOW()
      LIMIT 1
    `;
    return users[0] ? (users[0] as UserEntity) : null;
  }

  // Phone number methods
  async findUserByPhoneNumber(phoneNumber: string): Promise<UserEntity | null> {
    const user = await prisma.user.findFirst({
      where: { phoneNumber },
    });
    return user ? (user as UserEntity) : null;
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

  // MFA methods
  async findUserByEmailOtp(email: string, otp: string): Promise<UserEntity | null> {
    const users = await prisma.$queryRaw<User[]>`
      SELECT * FROM users 
      WHERE email = ${email}
      AND email_otp = ${otp}
      AND email_otp_expires_at > NOW()
      LIMIT 1
    `;
    return users[0] ? (users[0] as UserEntity) : null;
  }

  async findUserBySmsOtp(phoneNumber: string, otp: string): Promise<UserEntity | null> {
    const users = await prisma.$queryRaw<User[]>`
      SELECT * FROM users 
      WHERE phone_number = ${phoneNumber}
      AND sms_otp = ${otp}
      AND sms_otp_expires_at > NOW()
      LIMIT 1
    `;
    return users[0] ? (users[0] as UserEntity) : null;
  }

  // Refresh token methods
  async createRefreshToken(refreshTokenEntity: RefreshTokenEntity): Promise<RefreshTokenEntity> {
    const refreshToken = await prisma.refreshToken.create({
      data: refreshTokenToDatabase(refreshTokenEntity),
    });
    return refreshToken as RefreshTokenEntity;
  }

  async findRefreshToken(token: string): Promise<RefreshTokenEntity | null> {
    const refreshToken = await prisma.refreshToken.findFirst({
      where: {
        token,
        expiresAt: {
          gt: new Date(),
        },
        isRevoked: false,
      },
    });
    return refreshToken ? (refreshToken as RefreshTokenEntity) : null;
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

  // User statistics
  async getUserCount(): Promise<number> {
    const result = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM users
    `;
    return Number(result[0].count);
  }

  async getActiveUserCount(): Promise<number> {
    const result = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM users WHERE is_active = true
    `;
    return Number(result[0].count);
  }

  async getMfaEnabledUserCount(): Promise<number> {
    const result = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM users WHERE mfa_enabled = true
    `;
    return Number(result[0].count);
  }

  // Utility methods
  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}
