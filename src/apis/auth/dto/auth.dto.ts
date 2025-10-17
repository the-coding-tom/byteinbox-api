export class LoginDto {
  email: string;
  password: string;
}

export class LoginResponseDto {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    email: string;
    name?: string | null;
    photoUrl?: string | null;
    isEmailVerified: boolean;
    status: string;
  };
  defaultTeam: {
    id: number;
    reference: string;
    name: string;
    slug: string;
  };
}

// OAuth DTOs
export class OAuthCallbackDto {
  code?: string;
  state?: string;
  scope?: string;
  authuser?: string;
  prompt?: string;
  error?: string;
  error_description?: string;
}

export class OAuthUrlResponseDto {
  provider: string;
  url: string;
}

export class OAuthLoginResponseDto {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    email: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    photoUrl?: string;
    isEmailVerified: boolean;
    status: string;
  };
  defaultTeam: {
    id: number;
    reference: string;
    name: string;
    slug: string;
  };
}

export class LogoutDto {
  refreshToken: string;
}

export class RefreshTokenDto {
  refreshToken: string;
}

export class RefreshTokenResponseDto {
  accessToken: string;
  refreshToken: string;
}

export class ResetPasswordRequestDto {
  email: string;
}

export class ResetPasswordConfirmDto {
  token: string;
  newPassword: string;
}

export class ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export class RegisterDto {
  email: string;
  password: string;
  name: string;
}

export class VerifyEmailDto {
  token: string;
}

export class ResendVerificationDto {
  email: string;
}

export class MfaVerifyDto {
  code: string;
}

export class MfaChallengeDto {
  code: string;
  sessionToken: string;
}

export class MfaBackupCodeConsumeDto {
  code: string;
  sessionToken: string;
}

export class MfaDisableDto {
  code: string;
}

export class MfaRegenerateBackupCodesDto {
  code: string;
}

// MFA Response DTOs
export class TotpSetupResponseDto {
  qrCode: string;
  manualEntryKey: string;
  issuer: string;
  accountName: string;
}

export class TotpVerifySetupResponseDto {
  backupCodes: string[];
}

export class BackupCodesResponseDto {
  remainingCount: number;
  codes: string[]; // masked codes like "1234****"
}

export class RegenerateBackupCodesResponseDto {
  backupCodes: string[];
}
