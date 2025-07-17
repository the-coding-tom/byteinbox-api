import { MfaMethod } from '@prisma/client';

// User update DTOs
export class UpdateUserProfileDto {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
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
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}

export class OAuthLoginDto {
  provider: string;
  code: string;
  state: string;
}

export class RefreshTokenDto {
  refreshToken: string;
}

export class SendOtpDto {
  method: MfaMethod;
}

export class ForgotPasswordDto {
  email: string;
}

export class ResetPasswordDto {
  token: string;
  password: string;
}

export class VerifyEmailDto {
  token: string;
}

// MFA DTOs
export class SetupMfaDto {
  method: MfaMethod;
  phoneNumber?: string; // Required for SMS
}

export class VerifyMfaDto {
  code: string;
  method: MfaMethod;
}

export class EnableMfaDto {
  code: string;
  method: MfaMethod;
}

export class DisableMfaDto {
  code: string;
}

// Additional DTOs for controller endpoints
export class ResendVerificationDto {
  email: string;
}

export class ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

// Response DTOs
export class UserProfileDto {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: Date;
  mfaEnabled: boolean;
  mfaMethod?: MfaMethod | null;
  oauthProvider?: string;
  oauthId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Additional DTOs for new endpoints
export class VerifyEmailOtpDto {
  email: string;
  otp: string;
}

export class VerifySmsOtpDto {
  phoneNumber: string;
  otp: string;
}

export class VerifyTotpDto {
  code: string;
}

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
