import * as Handlebars from 'handlebars';

import { config } from '../config/config';
import { EmailTemplateRepository } from '../repositories/email-template.repository';

export interface EmailTemplateData {
  [key: string]: any;
}

export interface OtpEmailData extends EmailTemplateData {
  otp: string;
  firstName?: string;
  expiryMinutes: number;
  appName: string;
}

export interface EmailVerificationData extends EmailTemplateData {
  firstName?: string;
  verificationUrl: string;
  expiryHours: number;
  appName: string;
}

export interface PasswordResetData extends EmailTemplateData {
  firstName?: string;
  resetUrl: string;
  expiryMinutes: number;
  appName: string;
}

/**
 * Email template utility class for handling Handlebars templates
 */
export class EmailTemplateUtil {
  private static templateCache: Map<string, HandlebarsTemplateDelegate> = new Map();
  private static emailTemplateRepository: EmailTemplateRepository;

  /**
   * Set the email template repository (called during initialization)
   * @param repository - EmailTemplateRepository instance
   */
  static setRepository(repository: EmailTemplateRepository): void {
    this.emailTemplateRepository = repository;
  }

  /**
   * Initialize the email template utility with repository
   * @param repository - EmailTemplateRepository instance
   */
  static initialize(repository: EmailTemplateRepository): void {
    this.setRepository(repository);
  }

  /**
   * Compiles and caches a Handlebars template from database
   * @param templateName - Name of the template
   * @returns Compiled Handlebars template
   */
  private static async getTemplate(templateName: string): Promise<HandlebarsTemplateDelegate> {
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName)!;
    }

    if (!this.emailTemplateRepository) {
      throw new Error('EmailTemplateRepository not initialized. Call setRepository() first.');
    }

    const template = await this.emailTemplateRepository.findActiveEmailTemplateByName(templateName);
    if (!template) {
      throw new Error(`Email template not found: ${templateName}`);
    }

    const compiledTemplate = Handlebars.compile(template.htmlContent);
    this.templateCache.set(templateName, compiledTemplate);
    return compiledTemplate;
  }

  /**
   * Renders an email template with the provided data
   * @param templateName - Name of the template
   * @param data - Data to inject into the template
   * @returns Rendered HTML string
   */
  static async renderTemplate(templateName: string, data: EmailTemplateData): Promise<string> {
    const template = await this.getTemplate(templateName);
    return template(data);
  }

  /**
   * Renders OTP verification email template
   * @param data - OTP email data
   * @returns Rendered HTML string
   */
  static async renderOtpEmail(data: OtpEmailData): Promise<string> {
    return this.renderTemplate('otp-verification', {
      ...data,
      appName: data.appName || config.email.fromName,
    });
  }

  /**
   * Renders email verification template
   * @param data - Email verification data
   * @returns Rendered HTML string
   */
  static async renderEmailVerification(data: EmailVerificationData): Promise<string> {
    return this.renderTemplate('email-verification', {
      ...data,
      appName: data.appName || config.email.fromName,
    });
  }

  /**
   * Renders password reset template
   * @param data - Password reset data
   * @returns Rendered HTML string
   */
  static async renderPasswordReset(data: PasswordResetData): Promise<string> {
    return this.renderTemplate('password-reset', {
      ...data,
      appName: data.appName || config.email.fromName,
    });
  }

  /**
   * Clears the template cache (useful for development)
   */
  static clearCache(): void {
    this.templateCache.clear();
  }
}
