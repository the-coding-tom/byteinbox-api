export class EmailTemplateData {
  email: string;
  name?: string;
  appName?: string;
}

export class OtpEmailData extends EmailTemplateData {
  otp: string;
  reason: string;
  expiresIn: number;
  firstName?: string;
  expiryMinutes?: number;
}

export class EmailVerificationData extends EmailTemplateData {
  verificationUrl: string;
  expiresIn: number;
  expiryHours?: number;
}

export class PasswordResetData extends EmailTemplateData {
  resetUrl: string;
  expiresIn: number;
}

export class SecurityAlertData extends EmailTemplateData {
  alertType: string;
  details: string;
  timestamp: string | Date;
  message?: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
} 