export class RefreshTokenEntity {
  id: number;
  userId: number;
  token: string;
  expiresAt: Date;
  isRevoked: boolean;
  createdAt: Date;
  updatedAt: Date;
}
