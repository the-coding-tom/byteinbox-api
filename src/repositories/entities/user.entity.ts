export class FindUsersWithPaginationFilter {
  offset: number;
  limit: number;
  keyword?: string;
  status?: string;
}

export class CreateUserData {
  email: string;
  password?: string;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  emailVerificationToken?: string | null;
  emailVerificationExpiresAt?: Date | null;
  isEmailVerified?: boolean;
  status?: string;
  [key: string]: any; // Allow other fields for flexibility
}

export class UpdateUserData {
  firstName?: string | null;
  lastName?: string | null;
  password?: string | null;
  emailVerifiedAt?: Date | null;
  emailVerificationToken?: string | null;
  emailVerificationExpiresAt?: Date | null;
  passwordResetToken?: string | null;
  passwordResetExpiresAt?: Date | null;
  lastLoginAt?: Date | null;
  totpSecret?: string | null;
  totpEnabled?: boolean | null;
  status?: string;
  oauthProvider?: string;
  accessToken?: string;
  name?: string | null;
  [key: string]: any; // Allow other fields for flexibility
}

export class CreateOAuthUserData {
  email: string;
  firstName?: string;
  lastName?: string;
  isEmailVerified: boolean;
  oauthProvider: string;
  oauthId: string;
  accessToken?: string;
}

export class UserEntity {
  id: number;
  email: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
  timezone: string;
  language: string;
  status: string;
  type: string;
  emailVerifiedAt: Date | null;
  totpEnabled: boolean;
  totpSecret: string | null;
  createdAt: Date;
  updatedAt: Date;
  
  // Legacy/computed properties for backward compatibility
  isEmailVerified: boolean;
  password?: string | null;
  phoneNumber?: string | null;
  oauthProvider?: string | null;
  oauthId?: string | null;
  lastLoginAt?: Date | null;
  userType?: string;
  emailVerificationToken?: string | null;
  emailVerificationExpiresAt?: Date | null;
  passwordResetToken?: string | null;
  passwordResetExpiresAt?: Date | null;
  createdBy?: number | null;
}
