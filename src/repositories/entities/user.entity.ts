import { UserStatus, UserType } from '@prisma/client';

export class CreateUserData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  userType?: UserType;
  emailVerificationToken?: string;
  emailVerificationExpiresAt?: Date;
  oauthProvider?: string;
  oauthId?: string;
  isEmailVerified?: boolean;
}

export class UpdateUserData {
  email?: string;
  firstName?: string;
  lastName?: string;
  userType?: UserType;
  status?: UserStatus;
}

export class UserFilter {
  offset: number;
  limit: number;
  keyword?: string;
  status?: string;
  userType?: UserType;
}

export class UserEntity {
  id: number;
  email: string;
  password: string | null;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  userType: UserType;
  status: UserStatus;
  isEmailVerified: boolean;
  lastLoginAt: Date | null;
  oauthProvider: string | null;
  oauthId: string | null;
  totpSecret: string | null;
  totpEnabled: boolean;
  emailVerificationToken: string | null;
  emailVerificationExpiresAt: Date | null;
  passwordResetToken: string | null;
  passwordResetExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: number | null;
  updatedBy: number | null;
}
