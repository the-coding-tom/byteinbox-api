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

export function revokeRefreshToken(token: RefreshTokenEntity): RefreshTokenEntity {
  return {
    ...token,
    isRevoked: true,
  };
}

export function refreshTokenToDatabase(token: RefreshTokenEntity): any {
  return {
    userId: token.userId,
    token: token.token,
    expiresAt: token.expiresAt,
    isRevoked: token.isRevoked,
  };
}

export function isRefreshTokenExpired(token: RefreshTokenEntity): boolean {
  return token.expiresAt < new Date();
}

export function isRefreshTokenValid(token: RefreshTokenEntity): boolean {
  return !token.isRevoked && !isRefreshTokenExpired(token);
}
