// Password Reset DTOs
export class ForgotPasswordDto {
  email: string;
}

export class ResetPasswordDto {
  token: string;
  password: string;
}

export class ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

// Service Response DTOs
export class AuthResponse {
  status: number;
  message: string;
  data?: unknown;
  errorCode?: string;
} 