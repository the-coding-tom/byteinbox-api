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
  code: string;
  session_token: string;
}

export class EmailOtpVerifyResponseDto {
  success: boolean;
  message: string;
} 