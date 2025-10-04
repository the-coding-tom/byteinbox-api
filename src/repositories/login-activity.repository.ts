import { Injectable } from '@nestjs/common';
import prisma from '../common/prisma';
import { LoginActivityEntity } from './entities/login-activity.entity';

@Injectable()
export class LoginActivityRepository {
  async create(data: {
    userId: number;
    ipAddress: string;
    userAgent: string;
    location?: string;
    success: boolean;
  }): Promise<LoginActivityEntity> {
    const loginActivity = await prisma.loginActivity.create({
      data: {
        userId: data.userId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        location: data.location,
        success: data.success,
      },
    });

    return LoginActivityEntity.createEntity(loginActivity);
  }

  async findRecentByUserId(userId: number, limit: number = 5): Promise<LoginActivityEntity[]> {
    const loginActivities = await prisma.loginActivity.findMany({
      where: {
        userId,
        success: true, // Only successful logins for comparison
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return LoginActivityEntity.createEntities(loginActivities);
  }

  async findFailedAttemptsByUserId(userId: number, hours: number = 24): Promise<LoginActivityEntity[]> {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    const loginActivities = await prisma.loginActivity.findMany({
      where: {
        userId,
        success: false,
        createdAt: {
          gte: cutoffTime,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return LoginActivityEntity.createEntities(loginActivities);
  }

  async countFailedAttemptsByUserId(userId: number, hours: number = 1): Promise<number> {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    return await prisma.loginActivity.count({
      where: {
        userId,
        success: false,
        createdAt: {
          gte: cutoffTime,
        },
      },
    });
  }

  async deleteOldRecords(days: number = 90): Promise<number> {
    const cutoffTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const result = await prisma.loginActivity.deleteMany({
      where: {
        createdAt: {
          lt: cutoffTime,
        },
      },
    });

    return result.count;
  }

  // 2FA Activity Tracking methods
  async findTwoFactorActivityByUserId(userId: number, limit: number = 50): Promise<LoginActivityEntity[]> {
    const loginActivities = await prisma.loginActivity.findMany({
      where: {
        userId,
        // Filter for 2FA-related activities
        // We'll use the success field and additional context to identify 2FA activities
        OR: [
          { success: true }, // Successful 2FA verifications
          { success: false }, // Failed 2FA attempts
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return LoginActivityEntity.createEntities(loginActivities);
  }

  async createTwoFactorActivity(data: {
    userId: number;
    ipAddress: string;
    userAgent: string;
    location?: string;
    success: boolean;
    activityType?: string; // '2FA_VERIFICATION_SUCCESS', '2FA_VERIFICATION_FAILED', '2FA_SETUP', '2FA_DISABLE'
  }): Promise<LoginActivityEntity> {
    const loginActivity = await prisma.loginActivity.create({
      data: {
        userId: data.userId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        location: data.location,
        success: data.success,
        // We can add additional fields to track activity type if needed
      },
    });

    return LoginActivityEntity.createEntity(loginActivity);
  }
} 