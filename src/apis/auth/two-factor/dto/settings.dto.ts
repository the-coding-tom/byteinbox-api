// Settings and Activity DTOs
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

// Common Response DTOs
export class AuthResponse {
  status: number;
  message: string;
  data?: unknown;
  errorCode?: string;
}

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

export class TwoFactorErrorResponseDto {
  success: false;
  error: string;
  message: string;
  details?: Record<string, any>;
} 