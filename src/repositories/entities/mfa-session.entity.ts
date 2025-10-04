import { MfaMethod } from '@prisma/client';
import { UserEntity } from './user.entity';

export class MfaSessionEntity {
  id: number;
  sessionToken: string;
  userId: number;
  email: string;
  mfaMethod: MfaMethod;
  isVerified: boolean;
  expiresAt: Date;
  createdAt: Date;
  user?: UserEntity; // Optional user relation
} 