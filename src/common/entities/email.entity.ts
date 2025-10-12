export class EmailTemplateData {
  email: string;
  name?: string;
  appName?: string;
}

export class OtpEmailData {
  email: string;
  name?: string;
  appName?: string;
  otp: string;
  reason: string;
  expiresIn: number;
  firstName?: string;
  expiryMinutes?: number;
}

export class EmailVerificationData {
  email: string;
  name?: string;
  appName?: string;
  verificationUrl: string;
  expiresIn: number;
  expiryHours?: number;
}

export class PasswordResetData {
  email: string;
  name?: string;
  appName?: string;
  resetUrl: string;
  expiresIn: number;
}

export class SecurityAlertData {
  email: string;
  name?: string;
  appName?: string;
  alertType: string;
  details: string;
  timestamp: string | Date;
  message?: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
} 