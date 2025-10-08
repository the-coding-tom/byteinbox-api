import { Injectable } from '@nestjs/common';
import prisma from '../common/prisma';
import { LoginActivityEntity } from './entities/login-activity.entity';

@Injectable()
export class LoginActivityRepository {
  // Note: LoginActivity model doesn't exist in new schema
  // Using Session model as proxy for successful login tracking
  
  async create(data: {
    userId: number;
    ipAddress?: string;
    userAgent?: string;
    location?: string;
    success: boolean;
  }): Promise<LoginActivityEntity> {
    // For successful logins, we track via sessions
    // For failed logins, we just return a mock entity since we don't persist them
    return LoginActivityEntity.createEntity({
      id: Math.floor(Math.random() * 1000000),
      userId: data.userId,
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
      location: data.location,
      success: data.success,
      createdAt: new Date(),
    });
  }

  async findRecentByUserId(userId: number, limit: number = 5): Promise<LoginActivityEntity[]> {
    // Get recent sessions as proxy for login activity
    const sessions = await prisma.session.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return LoginActivityEntity.createEntities(
      sessions.map(session => ({
        id: session.id,
        userId: session.userId,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        success: true, // Sessions only exist for successful logins
        createdAt: session.createdAt,
      }))
    );
  }

  async findFailedAttemptsByUserId(userId: number, hours: number = 24): Promise<LoginActivityEntity[]> {
    // Failed attempts are not tracked in new schema
    return [];
  }

  async countFailedAttemptsByUserId(userId: number, hours: number = 1): Promise<number> {
    // Failed attempts are not tracked in new schema
    return 0;
  }

  async deleteOldRecords(days: number = 90): Promise<number> {
    const cutoffTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const result = await prisma.session.deleteMany({
      where: {
        createdAt: { lt: cutoffTime },
      },
    });

    return result.count;
  }

  // 2FA Activity Tracking methods
  async findTwoFactorActivityByUserId(userId: number, limit: number = 50): Promise<LoginActivityEntity[]> {
    // Use sessions as proxy
    return this.findRecentByUserId(userId, limit);
  }

  async createTwoFactorActivity(data: {
    userId: number;
    ipAddress?: string;
    userAgent?: string;
    location?: string;
    success: boolean;
    activityType?: string;
  }): Promise<LoginActivityEntity> {
    return this.create(data);
  }
} 