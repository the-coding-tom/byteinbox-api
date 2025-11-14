import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { INTERNAL_NOTIFICATION_QUEUE } from '../../common/constants/queues.constant';
import { config } from '../../config/config';

export interface SendInternalEmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Internal Notification Service
 *
 * Handles internal system notifications (email verification, password reset, etc.)
 * Uses a separate queue from customer emails to ensure system emails are prioritized
 * and don't compete with customer email traffic.
 *
 * Features:
 * - Sends from thomas@byteinbox.com
 * - No domain validation required
 * - Simple queue → send flow
 * - Separate from customer email infrastructure
 */
@Injectable()
export class InternalNotificationService {
  private readonly logger = new Logger(InternalNotificationService.name);

  constructor(
    @InjectQueue(INTERNAL_NOTIFICATION_QUEUE)
    private readonly internalNotificationQueue: Queue,
  ) {}

  /**
   * Send email verification notification
   */
  async sendEmailVerification(email: string, token: string): Promise<void> {
    const verificationUrl = `${config.frontendUrl}/verify-email?token=${token}`;

    await this.queueEmail({
      to: email,
      subject: 'Verify your ByteInbox account',
      html: `
        <h2>Welcome to ByteInbox!</h2>
        <p>Please verify your email address by clicking the link below:</p>
        <p><a href="${verificationUrl}">Verify Email</a></p>
        <p>Or copy and paste this link into your browser:</p>
        <p>${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <br>
        <p>If you didn't create an account with ByteInbox, you can safely ignore this email.</p>
      `,
      text: `Welcome to ByteInbox! Please verify your email address by visiting: ${verificationUrl}. This link will expire in 24 hours.`,
    });

    this.logger.log(`Email verification queued for ${email}`);
  }

  /**
   * Send password reset notification
   */
  async sendPasswordReset(email: string, token: string): Promise<void> {
    const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;

    await this.queueEmail({
      to: email,
      subject: 'Reset your ByteInbox password',
      html: `
        <h2>Password Reset Request</h2>
        <p>We received a request to reset your password. Click the link below to create a new password:</p>
        <p><a href="${resetUrl}">Reset Password</a></p>
        <p>Or copy and paste this link into your browser:</p>
        <p>${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <br>
        <p>If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
      `,
      text: `Password reset requested. Visit: ${resetUrl}. This link will expire in 1 hour.`,
    });

    this.logger.log(`Password reset email queued for ${email}`);
  }

  /**
   * Send welcome email after verification
   */
  async sendWelcome(email: string): Promise<void> {
    await this.queueEmail({
      to: email,
      subject: 'Welcome to ByteInbox!',
      html: `
        <p>Hey,</p>
        <br>
        <p>My name is Thomas — I'm the founder and CEO of ByteInbox.</p>
        <br>
        <p>We started ByteInbox because we wanted a better email API for developers.<br>
        A simple, fast, and elegant interface that just works.</p>
        <br>
        <p><strong>Here are 3 tips to get started:</strong></p>
        <ol>
          <li><a href="${config.frontendUrl}/emails/send">Send your first email</a></li>
          <li><a href="${config.frontendUrl}/domains">Add your domain</a></li>
          <li><a href="${config.frontendUrl}/docs">Check the docs</a></li>
        </ol>
        <br>
        <p><strong>P.S.:</strong> Why did you sign up? What brought you here?</p>
        <br>
        <p>Hit "Reply" and let me know. I read and reply to every email.</p>
        <br>
        <p>Cheers,<br>Thomas</p>
      `,
      text: `Hey,

My name is Thomas — I'm the founder and CEO of ByteInbox.

We started ByteInbox because we wanted a better email API for developers.
A simple, fast, and elegant interface that just works.

Here are 3 tips to get started:

1. Send your first email: ${config.frontendUrl}/emails/send
2. Add your domain: ${config.frontendUrl}/domains
3. Check the docs: ${config.frontendUrl}/docs

P.S.: Why did you sign up? What brought you here?

Hit "Reply" and let me know. I read and reply to every email.

Cheers,
Thomas`,
    });

    this.logger.log(`Welcome email queued for ${email}`);
  }

  /**
   * Queue internal email for sending
   */
  private async queueEmail(payload: SendInternalEmailPayload): Promise<void> {
    try {
      await this.internalNotificationQueue.add(
        'send-internal-email',
        payload,
        {
          attempts: config.queue.jobRetryAttempts,
          backoff: {
            type: 'exponential',
            delay: config.queue.jobRetryDelayMs,
          },
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to queue internal email to ${payload.to}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}

