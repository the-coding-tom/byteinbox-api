import * as nodemailer from 'nodemailer';
import * as QRCode from 'qrcode';
import * as speakeasy from 'speakeasy';
import { Twilio } from 'twilio';

import { MILLISECONDS_IN_MINUTE } from '../common/constants/time.constant';
import { config } from '../config/config';
import { EmailTemplateUtil } from '../utils/email-template.util';
import {
  generateNumericOtp as generateNumericOtpUtil,
  generateAlphanumericCode as generateAlphanumericCodeUtil,
} from '../utils/string.util';
import { validatePhoneNumber as validatePhoneNumberUtil } from '../utils/validation.util';

export interface TotpSetupResult {
  secret: string;
  qrCode: string;
  manualEntryKey: string;
}

// Initialize external service clients using environment variables directly
let twilioClient: Twilio | null = null;
let emailTransporter: nodemailer.Transporter | null = null;

// Initialize Twilio if credentials are available
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

// Initialize email transporter if credentials are available
if (config.email.smtp.host && config.email.smtp.user && config.email.smtp.pass) {
  emailTransporter = nodemailer.createTransport({
    host: config.email.smtp.host,
    port: config.email.smtp.port,
    secure: config.email.smtp.secure,
    auth: {
      user: config.email.smtp.user,
      pass: config.email.smtp.pass,
    },
  });
}

export class MfaHelper {
  // OTP Generation and Verification
  static generateNumericOtp(length: number = config.mfa.otpLength): string {
    return generateNumericOtpUtil(length);
  }

  static verifyOtp(providedOtp: string, storedOtp: string, expiresAt: Date): boolean {
    if (new Date() > expiresAt) {
      return false; // OTP expired
    }
    return providedOtp === storedOtp;
  }

  static validatePhoneNumber(phoneNumber: string): boolean {
    return validatePhoneNumberUtil(phoneNumber);
  }

  // Email OTP Functions
  static async sendEmailOtp(
    email: string,
    userFirstName?: string,
  ): Promise<{ otp: string; expiresAt: Date }> {
    if (!emailTransporter) {
      throw new Error('Email service is not configured');
    }

    const otp = this.generateNumericOtp();
    const expiresAt = new Date(Date.now() + config.mfa.otpExpiryMinutes * MILLISECONDS_IN_MINUTE);

    const mailOptions = {
      from: `"${config.email.fromName}" <${config.email.from}>`,
      to: email,
      subject: 'Your Login Verification Code',
      html: await EmailTemplateUtil.renderOtpEmail({
        otp,
        firstName: userFirstName,
        expiryMinutes: config.mfa.otpExpiryMinutes,
        appName: config.email.fromName,
      }),
    };

    try {
      await emailTransporter.sendMail(mailOptions);
      return { otp, expiresAt };
    } catch (error) {
      throw new Error(`Failed to send email OTP: ${error.message}`);
    }
  }

  // SMS OTP Functions
  static async sendSmsOtp(
    phoneNumber: string,
    userFirstName?: string,
  ): Promise<{ otp: string; expiresAt: Date }> {
    if (!twilioClient) {
      throw new Error('SMS service is not configured');
    }

    const otp = this.generateNumericOtp();
    const expiresAt = new Date(Date.now() + config.mfa.otpExpiryMinutes * MILLISECONDS_IN_MINUTE);

    const message = `${userFirstName ? `Hi ${userFirstName}, ` : ''}Your verification code is: ${otp}. This code will expire in ${config.mfa.otpExpiryMinutes} minutes.`;

    try {
      await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber,
      });

      return { otp, expiresAt };
    } catch (error) {
      throw new Error(`Failed to send SMS OTP: ${error.message}`);
    }
  }

  // TOTP Functions
  static generateTotpSecret(userEmail: string): TotpSetupResult {
    const secret = speakeasy.generateSecret({
      name: userEmail,
      issuer: config.email.fromName,
      length: 32,
    });

    return {
      secret: secret.base32,
      qrCode: '', // Will be populated by generateQrCode
      manualEntryKey: secret.base32,
    };
  }

  static async generateQrCode(secret: string, userEmail: string): Promise<string> {
    const otpAuthUrl = speakeasy.otpauthURL({
      secret,
      label: userEmail,
      issuer: config.email.fromName,
      encoding: 'base32',
    });

    return await QRCode.toDataURL(otpAuthUrl);
  }

  static async setupTotp(userEmail: string): Promise<TotpSetupResult> {
    const totpResult = this.generateTotpSecret(userEmail);
    totpResult.qrCode = await this.generateQrCode(totpResult.secret, userEmail);
    return totpResult;
  }

  static verifyTotpCode(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: config.mfa.totpWindow,
    });
  }

  // Backup Codes
  static generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(this.generateAlphanumericCode(8));
    }
    return codes;
  }

  private static generateAlphanumericCode(length: number): string {
    return generateAlphanumericCodeUtil(length);
  }
}
