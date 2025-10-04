import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

import { PROCESS_NOTIFICATION_QUEUE } from '../../common/constants/queues.constant';
import { logInfoMessage, logError } from '../../utils/logger';
import { EmailTemplateUtil } from '../../utils/email-template.util';
import { config } from '../../config/config';
import { EmailTemplateRepository } from '../../repositories/email-template.repository';

@Processor(PROCESS_NOTIFICATION_QUEUE)
export class NotificationQueueProcessor {
  private readonly logger = new Logger(NotificationQueueProcessor.name);

  constructor(private readonly emailTemplateRepository: EmailTemplateRepository) {
    this.logger.log('NotificationQueueProcessor initialized and ready to process jobs');
  }

  @Process('user-created')
  async handleUserCreated(job: Job<any>) {
    try {
      this.logger.log('Processing user-created notification');
      logInfoMessage(`NotificationQueueProcessor: Processing user-created notification - Job ID: ${job.id}, Data: ${JSON.stringify(job.data)}`);

      const { userId, email } = job.data;

      // Send welcome email
      this.logger.log(`Sending welcome email to: ${email}`);
      logInfoMessage(`NotificationQueueProcessor: Sending welcome email to ${email} - User ID: ${userId}, Job ID: ${job.id}`);

      // Here you would integrate with your notification service
      // await this.emailService.sendWelcomeEmail(email);

      this.logger.log(`User-created notification completed for user: ${userId}`);
      const duration = Date.now() - job.timestamp;
      logInfoMessage(`NotificationQueueProcessor: User-created notification completed for user ${userId} - Duration: ${duration}ms`);

    } catch (error) {
      this.logger.error(`Failed to process user-created notification: ${error}`);
      logError(`NotificationQueueProcessor: Failed to process user-created notification - Job ID: ${job.id}, Error: ${error}`);
      throw error; // Let Bull handle retries
    }
  }

  @Process('email-verification-sent')
  async handleEmailVerificationSent(job: Job<any>) {
    try {
      this.logger.log('Processing email-verification-sent notification');
      logInfoMessage(`NotificationQueueProcessor: Processing email-verification-sent notification - Job ID: ${job.id}, Data: ${JSON.stringify(job.data)}`);

      const { userId, email, token } = job.data;

      // Generate verification URL (points to frontend, not API)
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

      // Get template from database
      const template = await this.emailTemplateRepository.findActiveEmailTemplateByName('email-verification');
      let templateHtml = '';
      
      if (template) {
        templateHtml = template.htmlContent;
      } else {
        // Fallback template
        templateHtml = `
          <h2>Verify Your Email Address</h2>
          <p>Hello,</p>
          <p>Please click the link below to verify your email address:</p>
          <p><a href="{{verificationUrl}}">Verify Email</a></p>
          <p>This link will expire in {{expiryHours}} hours.</p>
          <p>Best regards,<br>{{appName}}</p>
        `;
      }

      // Render email template
      EmailTemplateUtil.renderEmailVerification(templateHtml, {
        email,
        verificationUrl,
        expiresIn: 24 * 60 * 60, // 24 hours in seconds
        expiryHours: 24, // 24 hours expiry
        appName: config.email.fromName,
      });

      this.logger.log(`Sending email verification to: ${email}`);
      logInfoMessage(`NotificationQueueProcessor: Sending email verification to ${email} - User ID: ${userId}, Job ID: ${job.id}, URL: ${verificationUrl}`);

      // Here you would integrate with your email service
      // await this.emailService.sendEmail({
      //   to: email,
      //   subject: 'Verify Your Email Address',
      //   html: emailHtml,
      // });

      this.logger.log(`Email verification sent for user: ${userId}`);
      const duration = Date.now() - job.timestamp;
      logInfoMessage(`NotificationQueueProcessor: Email verification sent for user ${userId} - Duration: ${duration}ms`);

    } catch (error) {
      this.logger.error(`Failed to process email-verification-sent notification: ${error}`);
      logError(`NotificationQueueProcessor: Failed to process email-verification-sent notification - Job ID: ${job.id}, Error: ${error}`);
      throw error;
    }
  }

  @Process('user-updated')
  async handleUserUpdated(job: Job<any>) {
    try {
      this.logger.log('Processing user-updated notification');
      logInfoMessage(`NotificationQueueProcessor: Processing user-updated notification - Job ID: ${job.id}, Data: ${JSON.stringify(job.data)}`);

      const { userId, email } = job.data;

      // Simulate sending update notification
      this.logger.log(`Sending update notification to: ${email}`);
      logInfoMessage(`NotificationQueueProcessor: Sending update notification to ${email} - User ID: ${userId}, Job ID: ${job.id}`);

      // Here you would integrate with your notification service
      // await this.emailService.sendUpdateNotification(email);

      this.logger.log(`User-updated notification completed for user: ${userId}`);
      const duration = Date.now() - job.timestamp;
      logInfoMessage(`NotificationQueueProcessor: User-updated notification completed for user ${userId} - Duration: ${duration}ms`);

    } catch (error) {
      this.logger.error(`Failed to process user-updated notification: ${error}`);
      logError(`NotificationQueueProcessor: Failed to process user-updated notification - Job ID: ${job.id}, Error: ${error}`);
      throw error;
    }
  }

  @Process('security-alert')
  async handleSecurityAlert(job: Job<any>) {
    try {
      this.logger.log('Processing security-alert notification');
      logInfoMessage(`NotificationQueueProcessor: Processing security-alert notification - Job ID: ${job.id}, Data: ${JSON.stringify(job.data)}`);

      const { userId, email, alertType, details } = job.data;

      // Get template from database
      const template = await this.emailTemplateRepository.findActiveEmailTemplateByName('security-alert');
      let templateHtml = '';
      
      if (template) {
        templateHtml = template.htmlContent;
      } else {
        // Fallback template
        templateHtml = `
          <h2>Security Alert</h2>
          <p>Hello,</p>
          <p>We detected {{alertType}} activity on your account.</p>
          <p>Details: {{details}}</p>
          <p>If this wasn't you, please secure your account immediately.</p>
          <p>Best regards,<br>{{appName}}</p>
        `;
      }

      // Render email template
      EmailTemplateUtil.renderSecurityAlert(templateHtml, {
        email,
        alertType,
        details,
        timestamp: new Date().toISOString(),
        appName: config.email.fromName,
      });

      this.logger.log(`Sending security alert to: ${email}`);
      logInfoMessage(`NotificationQueueProcessor: Sending security alert to ${email} - User ID: ${userId}, Job ID: ${job.id}, Alert Type: ${alertType}`);

      // Here you would integrate with your email service
      // await this.emailService.sendEmail({
      //   to: email,
      //   subject: 'Security Alert - Suspicious Activity Detected',
      //   html: emailHtml,
      // });

      this.logger.log(`Security alert sent for user: ${userId}`);
      const duration = Date.now() - job.timestamp;
      logInfoMessage(`NotificationQueueProcessor: Security alert sent for user ${userId} - Duration: ${duration}ms`);

    } catch (error) {
      this.logger.error(`Failed to process security-alert notification: ${error}`);
      logError(`NotificationQueueProcessor: Failed to process security-alert notification - Job ID: ${job.id}, Error: ${error}`);
      throw error;
    }
  }
}

// Utility functions for masking sensitive data

