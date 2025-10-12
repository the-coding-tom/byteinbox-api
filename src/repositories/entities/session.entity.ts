export class CreateSessionData {
  userId: number;
  token: string;
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
  isRevoked?: boolean;
}

