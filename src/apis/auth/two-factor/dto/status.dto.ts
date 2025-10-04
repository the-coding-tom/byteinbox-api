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