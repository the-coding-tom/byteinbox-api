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
} 