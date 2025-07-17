import { MfaMethod } from '@prisma/client';

import { UserEntity } from '../repositories/entities/user.entity';

// Factory functions for creating users
export function createLocalUser(data: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  isEmailVerified?: boolean;
}): UserEntity {
  return {
    email: data.email,
    password: data.password,
    firstName: data.firstName || null,
    lastName: data.lastName || null,
    phoneNumber: data.phoneNumber || null,
    isEmailVerified: data.isEmailVerified || false,
    isActive: true,
    mfaEnabled: false,
    mfaMethod: null,
  } as UserEntity;
}

export function createOAuthUser(data: {
  email: string;
  firstName?: string;
  lastName?: string;
  oauthProvider: string;
  oauthId: string;
  isEmailVerified?: boolean;
}): UserEntity {
  return {
    email: data.email,
    password: null,
    firstName: data.firstName || null,
    lastName: data.lastName || null,
    phoneNumber: null,
    oauthProvider: data.oauthProvider,
    oauthId: data.oauthId,
    isEmailVerified: data.isEmailVerified || true,
    isActive: true,
    mfaEnabled: false,
    mfaMethod: null,
  } as UserEntity;
}

// Update functions that return new UserEntity instances
export function updateProfile(
  user: UserEntity,
  data: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
  },
): UserEntity {
  return {
    ...user,
    firstName: data.firstName ?? user.firstName,
    lastName: data.lastName ?? user.lastName,
    phoneNumber: data.phoneNumber ?? user.phoneNumber,
  };
}

export function updatePassword(user: UserEntity, password: string): UserEntity {
  return {
    ...user,
    password,
  };
}

export function updateMfa(
  user: UserEntity,
  data: {
    mfaEnabled: boolean;
    mfaMethod?: MfaMethod | null;
    totpSecret?: string;
  },
): UserEntity {
  return {
    ...user,
    mfaEnabled: data.mfaEnabled,
    mfaMethod: data.mfaMethod ?? user.mfaMethod,
    totpSecret: data.totpSecret ?? user.totpSecret,
  };
}

export function updateOtp(
  user: UserEntity,
  data: {
    emailOtp?: string;
    emailOtpExpiresAt?: Date;
    smsOtp?: string;
    smsOtpExpiresAt?: Date;
  },
): UserEntity {
  return {
    ...user,
    emailOtp: data.emailOtp ?? user.emailOtp,
    emailOtpExpiresAt: data.emailOtpExpiresAt ?? user.emailOtpExpiresAt,
    smsOtp: data.smsOtp ?? user.smsOtp,
    smsOtpExpiresAt: data.smsOtpExpiresAt ?? user.smsOtpExpiresAt,
  };
}

export function updateVerification(
  user: UserEntity,
  data: {
    emailVerificationToken?: string;
    emailVerificationExpiresAt?: Date;
    passwordResetToken?: string;
    passwordResetExpiresAt?: Date;
  },
): UserEntity {
  return {
    ...user,
    emailVerificationToken: data.emailVerificationToken ?? user.emailVerificationToken,
    emailVerificationExpiresAt: data.emailVerificationExpiresAt ?? user.emailVerificationExpiresAt,
    passwordResetToken: data.passwordResetToken ?? user.passwordResetToken,
    passwordResetExpiresAt: data.passwordResetExpiresAt ?? user.passwordResetExpiresAt,
  };
}

export function updateOAuth(
  user: UserEntity,
  data: {
    oauthProvider?: string;
    oauthId?: string;
  },
): UserEntity {
  return {
    ...user,
    oauthProvider: data.oauthProvider ?? user.oauthProvider,
    oauthId: data.oauthId ?? user.oauthId,
  };
}

export function updateLoginTime(user: UserEntity): UserEntity {
  return {
    ...user,
    lastLoginAt: new Date(),
  };
}

export function updateEmailVerification(user: UserEntity, isVerified: boolean): UserEntity {
  return {
    ...user,
    isEmailVerified: isVerified,
    emailVerificationToken: null,
    emailVerificationExpiresAt: null,
  };
}

export function clearOtp(user: UserEntity): UserEntity {
  return {
    ...user,
    emailOtp: null,
    emailOtpExpiresAt: null,
    smsOtp: null,
    smsOtpExpiresAt: null,
  };
}

export function clearPasswordReset(user: UserEntity): UserEntity {
  return {
    ...user,
    passwordResetToken: null,
    passwordResetExpiresAt: null,
  };
}

export function clearEmailVerification(user: UserEntity): UserEntity {
  return {
    ...user,
    emailVerificationToken: null,
    emailVerificationExpiresAt: null,
  };
}

// Convert to database format (for Prisma)
export function toDatabase(user: UserEntity): any {
  return {
    email: user.email,
    password: user.password,
    firstName: user.firstName,
    lastName: user.lastName,
    phoneNumber: user.phoneNumber,
    isActive: user.isActive,
    isEmailVerified: user.isEmailVerified,
    lastLoginAt: user.lastLoginAt,
    oauthProvider: user.oauthProvider,
    oauthId: user.oauthId,
    mfaEnabled: user.mfaEnabled,
    mfaMethod: user.mfaMethod,
    totpSecret: user.totpSecret,
    emailOtp: user.emailOtp,
    emailOtpExpiresAt: user.emailOtpExpiresAt,
    smsOtp: user.smsOtp,
    smsOtpExpiresAt: user.smsOtpExpiresAt,
    emailVerificationToken: user.emailVerificationToken,
    emailVerificationExpiresAt: user.emailVerificationExpiresAt,
    passwordResetToken: user.passwordResetToken,
    passwordResetExpiresAt: user.passwordResetExpiresAt,
  };
}

// Utility functions
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
  return user.mfaEnabled && !!user.mfaMethod;
}

export function isEmailOtpValid(user: UserEntity): boolean {
  return !!(user.emailOtp && user.emailOtpExpiresAt && user.emailOtpExpiresAt > new Date());
}

export function isSmsOtpValid(user: UserEntity): boolean {
  return !!(user.smsOtp && user.smsOtpExpiresAt && user.smsOtpExpiresAt > new Date());
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
