

// Service Response DTOs
export class AuthResponse {
  status: number;
  message: string;
  data?: unknown;
  errorCode?: string;
}

// 2FA Status & Setup DTOs
export class TwoFactorStatusDto {
  enabled: boolean;
  methods: {
    totp: {
      enabled: boolean;
      setup_at?: Date;
    };
    backup_codes: {
      enabled: boolean;
      remaining_count: number;
      generated_at?: Date;
    };
    email_otp: {
      enabled: boolean;
      email: string;
    };
  };
}

export class TotpSetupResponseDto {
  qr_code: string;
  manual_entry_key: string;
  issuer: string;
  account_name: string;
}

export class TotpVerifySetupDto {
  code: string;
}

export class TotpVerifySetupResponseDto {
  backup_codes: string[];
}

export class TotpDisableDto {
  verification_code: string;
}

// Backup Codes DTOs
export class BackupCodesResponseDto {
  remaining_count: number;
  codes: string[]; // masked codes like "1234****"
}

export class RegenerateBackupCodesDto {
  current_password: string;
  verification_method: 'totp' | 'email_otp';
  verification_code: string;
}

export class RegenerateBackupCodesResponseDto {
  backup_codes: string[];
  message: string;
}

// Email OTP DTOs
export class EmailOtpSendDto {
  session_token: string;
  reason: 'login' | 'recovery' | 'verification';
}

export class EmailOtpSendResponseDto {
  email: string; // masked like "u***@example.com"
  expires_in: number;
  rate_limit: {
    remaining: number;
    reset_in: number;
  };
}

export class EmailOtpVerifyDto {
  session_token: string;
  code: string;
}

export class EmailOtpVerifyResponseDto {
  success: boolean;
  message: string;
}

// Two-Factor Verification DTOs
export class TwoFactorVerifyDto {
  method: 'totp' | 'backup_code' | 'email_otp';
  code: string;
  session_token: string;
}

export class TwoFactorVerifyResponseDto {
  success: boolean;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  message?: string;
  attempts_remaining?: number;
  retry_after?: number;
}

// Recovery DTOs
export class RecoveryInitiateDto {
  email: string;
  reason: 'lost_all_2fa_methods';
}

export class RecoveryInitiateResponseDto {
  success: boolean;
  recovery_id: string;
  message: string;
  estimated_review_time: string;
}

export class RecoveryVerifyDto {
  recovery_token: string;
  new_password: string;
  security_answers?: {
    question_1?: string;
    question_2?: string;
  };
}

// Settings & Activity DTOs
export class TwoFactorSettingsDto {
  email_notifications?: boolean;
  backup_email?: string;
  require_2fa_for_api_access?: boolean;
}

export class TwoFactorActivityDto {
  recent_activity: Array<{
    timestamp: Date;
    method: string;
    action: string;
    ip_address: string;
    user_agent: string;
    status: 'success' | 'failed';
  }>;
}

export class TwoFactorErrorResponseDto {
  success: false;
  error: string;
  message: string;
  details?: Record<string, any>;
} 