export class BackupCodeEntity {
  id: number;
  userId: number;
  code: string;
  isUsed: boolean;
  usedAt?: Date | null;
  createdAt: Date;
}

export function createBackupCodeEntity(data: {
  id: number;
  userId: number;
  code: string;
  isUsed: boolean;
  usedAt?: Date | null;
  createdAt: Date;
}): BackupCodeEntity {
  return {
    id: data.id,
    userId: data.userId,
    code: data.code,
    isUsed: data.isUsed,
    usedAt: data.usedAt,
    createdAt: data.createdAt,
  };
} 