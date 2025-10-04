import { Injectable } from '@nestjs/common';
import prisma from '../common/prisma';
import { BackupCodeEntity } from './entities/backup-code.entity';

@Injectable()
export class BackupCodeRepository {
  async createBackupCodes(userId: number, hashedCodes: string[]): Promise<BackupCodeEntity[]> {
    await prisma.backupCode.createMany({
      data: hashedCodes.map(code => ({
        userId,
        code,
        isUsed: false,
      })),
    });

    return this.findByUserId(userId);
  }

  async findByUserId(userId: number): Promise<BackupCodeEntity[]> {
    const backupCodes = await prisma.backupCode.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    return backupCodes.map(backupCode => ({
      id: backupCode.id,
      userId: backupCode.userId,
      code: backupCode.code,
      isUsed: backupCode.isUsed,
      usedAt: backupCode.usedAt,
      createdAt: backupCode.createdAt,
    }));
  }

  async findUnusedByUserId(userId: number): Promise<BackupCodeEntity[]> {
    const backupCodes = await prisma.backupCode.findMany({
      where: { 
        userId,
        isUsed: false,
      },
      orderBy: { createdAt: 'asc' },
    });

    return backupCodes.map(backupCode => ({
      id: backupCode.id,
      userId: backupCode.userId,
      code: backupCode.code,
      isUsed: backupCode.isUsed,
      usedAt: backupCode.usedAt,
      createdAt: backupCode.createdAt,
    }));
  }

  async findByCode(code: string): Promise<BackupCodeEntity | null> {
    const backupCode = await prisma.backupCode.findFirst({
      where: { code },
    });

    if (!backupCode) return null;

    return {
      id: backupCode.id,
      userId: backupCode.userId,
      code: backupCode.code,
      isUsed: backupCode.isUsed,
      usedAt: backupCode.usedAt,
      createdAt: backupCode.createdAt,
    };
  }

  async findByHashedCode(userId: number, hashedCode: string): Promise<BackupCodeEntity | null> {
    const backupCode = await prisma.backupCode.findFirst({
      where: { 
        userId,
        code: hashedCode,
        isUsed: false,
      },
    });

    if (!backupCode) return null;

    return {
      id: backupCode.id,
      userId: backupCode.userId,
      code: backupCode.code,
      isUsed: backupCode.isUsed,
      usedAt: backupCode.usedAt,
      createdAt: backupCode.createdAt,
    };
  }

  async markAsUsed(id: number): Promise<void> {
    await prisma.backupCode.update({
      where: { id },
      data: {
        isUsed: true,
        usedAt: new Date(),
      },
    });
  }

  async deleteByUserId(userId: number): Promise<void> {
    await prisma.backupCode.deleteMany({
      where: { userId },
    });
  }

  async countUnusedByUserId(userId: number): Promise<number> {
    return await prisma.backupCode.count({
      where: {
        userId,
        isUsed: false,
      },
    });
  }
} 