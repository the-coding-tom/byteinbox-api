import { UserStatus } from '@prisma/client';

// Admin User Management DTOs
export class AdminUserUpdateDto {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  userType?: string;
  status?: string;
  isEmailVerified?: boolean;
}

export class AdminUserCreateDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  userType?: string;
  status?: string;
  isEmailVerified?: boolean;
}

export class CreateUserByAdminDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  userType?: string;
  status?: string;
  isEmailVerified?: boolean;
}

export class UpdateUserByAdminDto {
  id: number;
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  userType?: string;
  status?: string;
  isEmailVerified?: boolean;
}

export class AdminUserProfileDto {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  userType: string;
  status: string;
  isEmailVerified: boolean;
  lastLoginAt?: Date;
  oauthProvider?: string;
  oauthId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class AdminUserFilterDto {
  offset?: number;
  limit?: number;
  keyword?: string;
  status?: string;
  userType?: string;
  isEmailVerified?: boolean;
}

export class ResetUserMfaDto {
  userId: number;
}

export class UnlockUserAccountDto {
  userId: number;
}

export class DeactivateUserAccountDto {
  userId: number;
}

export class DeleteUserAccountDto {
  userId: number;
}

// Admin User Response DTOs
export class AdminUserResponse {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  status: UserStatus;
  isEmailVerified: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class AdminUsersListResponse {
  data: AdminUserResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class AdminUserStatsResponse {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  pendingUsers: number;
  suspendedUsers: number;
  emailVerifiedUsers: number;
}

export class SystemStatsResponse {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  suspendedUsers: number;
} 