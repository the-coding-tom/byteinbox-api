import { Injectable } from '@nestjs/common';
import prisma from '../common/prisma';
import { BackupCodeEntity } from './entities/backup-code.entity';

@Injectable()
export class BackupCodeRepository {
  async createBackupCodes(userId: number, hashedCodes: string[]): Promise<BackupCodeEntity[]> {
    await prisma.mfaBackupCode.createMany({
      data: hashedCodes.map(code => ({
        userId,
        code,
        used: false,
      })),
    });

    return this.findByUserId(userId);
  }

  async findByUserId(userId: number): Promise<BackupCodeEntity[]> {
    const backupCodes = await prisma.mfaBackupCode.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    return backupCodes.map((backupCode: any) => ({
      id: backupCode.id,
      userId: backupCode.userId,
      code: backupCode.code,
      isUsed: backupCode.used,
      usedAt: backupCode.usedAt,
      createdAt: backupCode.createdAt,
    }));
  }

  async findUnusedByUserId(userId: number): Promise<BackupCodeEntity[]> {
    const backupCodes = await prisma.mfaBackupCode.findMany({
      where: { 
        userId,
        used: false,
      },
      orderBy: { createdAt: 'asc' },
    });

    return backupCodes.map((backupCode: any) => ({
      id: backupCode.id,
      userId: backupCode.userId,
      code: backupCode.code,
      isUsed: backupCode.used,
      usedAt: backupCode.usedAt,
      createdAt: backupCode.createdAt,
    }));
  }

  async findByCode(code: string): Promise<BackupCodeEntity | null> {
    const backupCode = await prisma.mfaBackupCode.findFirst({
      where: { code },
    });

    if (!backupCode) return null;

    return {
      id: backupCode.id,
      userId: backupCode.userId,
      code: backupCode.code,
      isUsed: backupCode.used,
      usedAt: backupCode.usedAt,
      createdAt: backupCode.createdAt,
    };
  }

  async findByHashedCode(userId: number, hashedCode: string): Promise<BackupCodeEntity | null> {
    const backupCode = await prisma.mfaBackupCode.findFirst({
      where: { 
        userId,
        code: hashedCode,
        used: false,
      },
    });

    if (!backupCode) return null;

    return {
      id: backupCode.id,
      userId: backupCode.userId,
      code: backupCode.code,
      isUsed: backupCode.used,
      usedAt: backupCode.usedAt,
      createdAt: backupCode.createdAt,
    };
  }

  async markAsUsed(id: number): Promise<void> {
    await prisma.mfaBackupCode.update({
      where: { id },
      data: {
        used: true,
        usedAt: new Date(),
      },
    });
  }

  async deleteByUserId(userId: number): Promise<void> {
    await prisma.mfaBackupCode.deleteMany({
      where: { userId },
    });
  }

  async countUnusedByUserId(userId: number): Promise<number> {
    return await prisma.mfaBackupCode.count({
      where: {
        userId,
        used: false,
      },
    });
  }
} 