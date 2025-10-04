// User update DTOs
export class UpdateUserProfileDto {
  firstName?: string;
  lastName?: string;
}

export class UpdateUserPasswordDto {
  password: string;
}

// Authentication DTOs
export class LoginDto {
  email: string;
  password: string;
}

export class RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export class OAuthLoginDto {
  provider: string;
  code: string;
  state: string;
}

export class RefreshTokenDto {
  refreshToken: string;
}

export class VerifyEmailDto {
  token: string;
}

export class ResendVerificationDto {
  email: string;
}

// OAuth Callback DTO
export class OAuthCallbackDto {
  code?: string;
  state?: string;
  scope?: string; // Google OAuth scope parameter
  authuser?: string; // Google OAuth authuser parameter
  prompt?: string; // Google OAuth prompt parameter
  error?: string; // OAuth error parameter
  error_description?: string; // OAuth error description
}

// Response DTOs
export class UserProfileDto {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  status: string;
  isEmailVerified: boolean;
  lastLoginAt?: Date;
  oauthProvider?: string;
  oauthId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Admin DTOs
export class DeactivateAccountDto {
  userId: number;
}

export class DeleteAccountDto {
  userId: number;
  password: string;
}

export class GetActiveSessionsDto {
  userId: number;
}

export class RevokeAllSessionsDto {
  userId: number;
}

export class GetSecurityActivityDto {
  userId: number;
}

export class ResetUserMfaDto {
  userId: number;
}

export class UnlockAccountDto {
  userId: number;
}
