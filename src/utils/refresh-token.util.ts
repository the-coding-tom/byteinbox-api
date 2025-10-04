import { RefreshTokenEntity } from '../repositories/entities/refresh-token.entity';

export function createRefreshToken(data: {
  userId: number;
  token: string;
  expiresAt: Date;
}): RefreshTokenEntity {
  return {
    id: 0, // to be set by DB
    userId: data.userId,
    token: data.token,
    expiresAt: data.expiresAt,
    isRevoked: false,
    createdAt: new Date(), // to be set by DB
    updatedAt: new Date(), // to be set by DB
  };
} 