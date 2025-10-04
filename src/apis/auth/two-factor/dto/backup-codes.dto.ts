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