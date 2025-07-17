import { OAuthUserInfoEntity } from '../repositories/entities/oauth-user-info.entity';

export function getFullName(user: OAuthUserInfoEntity): string {
  const parts = [user.firstName, user.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : user.email;
}
