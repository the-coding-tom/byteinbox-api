import * as Handlebars from 'handlebars';
import { config } from '../config/config';
import { EmailTemplateData, OtpEmailData, EmailVerificationData, PasswordResetData, SecurityAlertData } from '../common/entities/email.entity';

/**
 * Email template utility class for handling Handlebars templates
 * Pure utility - no database coupling, just template rendering
 * 
 * Usage example:
 * ```typescript
 * // In your service
 * const template = await this.emailTemplateRepository.findActiveEmailTemplateByName('otp-verification');
 * const html = EmailTemplateUtil.renderOtpEmail(template.htmlContent, {
 *   email: 'user@example.com',
 *   otp: '123456',
 *   firstName: 'John'
 * });
 * ```
 */
export class EmailTemplateUtil {
  /**
   * Renders an email template with the provided data
   * @param templateHtml - Raw HTML template string
   * @param data - Data to inject into the template
   * @returns Rendered HTML string
   */
  static renderTemplate(templateHtml: string, data: EmailTemplateData): string {
    const template = Handlebars.compile(templateHtml);
    return template(data);
  }

  /**
   * Renders OTP verification email template
   * @param templateHtml - Raw HTML template string
   * @param data - OTP email data
   * @returns Rendered HTML string
   */
  static renderOtpEmail(templateHtml: string, data: OtpEmailData): string {
    return this.renderTemplate(templateHtml, {
      ...data,
      appName: data.appName || config.email.fromName,
    });
  }

  /**
   * Renders email verification template
   * @param templateHtml - Raw HTML template string
   * @param data - Email verification data
   * @returns Rendered HTML string
   */
  static renderEmailVerification(templateHtml: string, data: EmailVerificationData): string {
    return this.renderTemplate(templateHtml, {
      ...data,
      appName: data.appName || config.email.fromName,
    });
  }

  /**
   * Renders password reset template
   * @param templateHtml - Raw HTML template string
   * @param data - Password reset data
   * @returns Rendered HTML string
   */
  static renderPasswordReset(templateHtml: string, data: PasswordResetData): string {
    return this.renderTemplate(templateHtml, {
      ...data,
      appName: data.appName || config.email.fromName,
    });
  }

  /**
   * Renders security alert template
   * @param templateHtml - Raw HTML template string
   * @param data - Security alert data
   * @returns Rendered HTML string
   */
  static renderSecurityAlert(templateHtml: string, data: SecurityAlertData): string {
    return this.renderTemplate(templateHtml, {
      ...data,
      appName: data.appName || config.email.fromName,
    });
  }
}
