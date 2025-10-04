import { UserStatus, UserType } from '@prisma/client';

import { UserEntity } from '../repositories/entities/user.entity';

// Factory functions for creating users (keep these - they have complex logic)
export function createLocalUser(data: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  isEmailVerified?: boolean;
}): Partial<UserEntity> {
  return {
    email: data.email,
    password: data.password,
    firstName: data.firstName || null,
    lastName: data.lastName || null,
    phoneNumber: data.phoneNumber || null,
    isEmailVerified: data.isEmailVerified || false,
    status: UserStatus.PENDING,
  };
}

export function createOAuthUser(data: {
  email: string;
  firstName?: string;
  lastName?: string;
  oauthProvider: string;
  oauthId: string;
  isEmailVerified?: boolean;
}): Partial<UserEntity> {
  return {
    email: data.email,
    password: null,
    firstName: data.firstName || null,
    lastName: data.lastName || null,
    phoneNumber: null,
    oauthProvider: data.oauthProvider,
    oauthId: data.oauthId,
    isEmailVerified: data.isEmailVerified || true,
    status: UserStatus.PENDING,
  };
}

export function createUserEntity(userData: Partial<UserEntity>): UserEntity {
  return {
    id: 0,
    email: '',
    password: null,
    firstName: null,
    lastName: null,
    phoneNumber: null,
    userType: UserType.USER,
    status: UserStatus.PENDING,
    isEmailVerified: false,
    lastLoginAt: null,
    oauthProvider: null,
    oauthId: null,
    totpSecret: null,
    totpEnabled: false,
    emailVerificationToken: null,
    emailVerificationExpiresAt: null,
    passwordResetToken: null,
    passwordResetExpiresAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: null,
    updatedBy: null,
    ...userData,
  };
}

export function createUserEntityFromPrisma(prismaUser: any): UserEntity {
  return {
    id: prismaUser.id,
    email: prismaUser.email,
    password: prismaUser.password,
    firstName: prismaUser.firstName,
    lastName: prismaUser.lastName,
    phoneNumber: prismaUser.phoneNumber,
    userType: prismaUser.userType,
    status: prismaUser.status,
    isEmailVerified: prismaUser.isEmailVerified,
    lastLoginAt: prismaUser.lastLoginAt,
    oauthProvider: prismaUser.oauthProvider,
    oauthId: prismaUser.oauthId,
    totpSecret: prismaUser.totpSecret,
    totpEnabled: prismaUser.totpEnabled,
    emailVerificationToken: prismaUser.emailVerificationToken,
    emailVerificationExpiresAt: prismaUser.emailVerificationExpiresAt,
    passwordResetToken: prismaUser.passwordResetToken,
    passwordResetExpiresAt: prismaUser.passwordResetExpiresAt,
    createdAt: prismaUser.createdAt,
    updatedAt: prismaUser.updatedAt,
    createdBy: prismaUser.createdBy,
    updatedBy: prismaUser.updatedBy,
  };
}

// Utility functions with real logic (keep these)
export function getFullName(user: UserEntity): string {
  const parts = [user.firstName, user.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : user.email;
}

export function isOAuthUser(user: UserEntity): boolean {
  return !!(user.oauthProvider && user.oauthId);
}

export function isLocalUser(user: UserEntity): boolean {
  return !!user.password;
}

export function hasMfaEnabled(user: UserEntity): boolean {
  return user.totpEnabled;
}

export function isEmailVerificationTokenValid(user: UserEntity): boolean {
  return !!(
    user.emailVerificationToken
    && user.emailVerificationExpiresAt
    && user.emailVerificationExpiresAt > new Date()
  );
}

export function isPasswordResetTokenValid(user: UserEntity): boolean {
  return !!(
    user.passwordResetToken
    && user.passwordResetExpiresAt
    && user.passwordResetExpiresAt > new Date()
  );
} 