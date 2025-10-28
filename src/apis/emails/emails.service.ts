import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { EmailsValidator } from './emails.validator';
import { generateSuccessResponse } from '../../utils/util';
import { handleServiceError } from '../../utils/error.util';
import { Constants } from '../../common/enums/generic.enum';
import { SEND_EMAIL_QUEUE, PROCESS_EMAIL_EVENT_QUEUE } from '../../common/constants/queues.constant';
import { EmailRepository } from '../../repositories/email.repository';
import { SendEmailDto, EmailFilterDto, SnsMessageType, SnsMessageDto, SesCombinedMessageDto } from './dto/emails.dto';
import { config } from '../../config/config';
import { verifySnsSignature } from '../../helpers/sns-signature.helper';
import * as https from 'https';

@Injectable()
export class EmailsService {
  private readonly logger = new Logger(EmailsService.name);

  constructor(
    private readonly emailsValidator: EmailsValidator,
    private readonly emailRepository: EmailRepository,
    @InjectQueue(SEND_EMAIL_QUEUE) private readonly sendEmailQueue: Queue,
    @InjectQueue(PROCESS_EMAIL_EVENT_QUEUE) private readonly emailEventQueue: Queue,
  ) { }

  async sendEmail(request: any, sendEmailDto: SendEmailDto): Promise<any> {
    try {
      const userId = request.user.id;
      const teamId = request.teamId;

      // Validate input data, extract domain, and verify domain
      const { domain } = await this.emailsValidator.validateSendEmail(sendEmailDto, teamId);

      // Store email with attachments - downloads from path happen in queue processor
      // Note: Validator ensures content is already base64 string (transforms Buffer if needed)
      const email = await this.emailRepository.createEmailWithAttachments(
        {
          createdBy: userId,
          teamId,
          domainId: domain.id,
          apiKeyId: request.user.apiKeyId,
          from: sendEmailDto.from,
          to: sendEmailDto.to,
          cc: sendEmailDto.cc,
          bcc: sendEmailDto.bcc,
          replyTo: sendEmailDto.replyTo,
          subject: sendEmailDto.subject,
          text: sendEmailDto.text,
          html: sendEmailDto.html,
        },
        sendEmailDto.attachments as any[]
      );

      // Enqueue email for sending
      await this.sendEmailQueue.add(
        'send-email',
        {
          emailId: email.id,
        },
        {
          attempts: config.queue.jobRetryAttempts,
          backoff: {
            type: 'exponential',
            delay: config.queue.jobRetryDelayMs,
          },
        }
      );

      return generateSuccessResponse({
        statusCode: HttpStatus.CREATED,
        message: Constants.successMessage,
        data: {
          id: email.reference,
        },
      });
    } catch (error) {
      return handleServiceError('Error sending email', error);
    }
  }

  async getEmails(request: any, filter: EmailFilterDto): Promise<any> {
    try {
      const teamId = request.teamId;

      // Validate filter parameters
      const { validatedData } = await this.emailsValidator.validateGetEmailsQuery(filter);

      // Set defaults from config and calculate pagination
      const page = validatedData.page || config.validation.pagination.defaultPage;
      const limit = validatedData.limit || config.validation.pagination.defaultLimit;
      const offset = (page - 1) * limit;

      // Parse dates if provided
      const dateFrom = validatedData.startDate ? new Date(validatedData.startDate) : undefined;
      const dateTo = validatedData.endDate ? new Date(validatedData.endDate) : undefined;

      // Fetch emails with filtering and pagination
      const result = await this.emailRepository.findWithFilter({
        teamId,
        keyword: validatedData.keyword,
        status: validatedData.status,
        dateFrom,
        dateTo,
        offset,
        limit,
      });

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.successMessage,
        data: result.data,
        meta: {
          page,
          limit,
          total: result.total,
        },
      });
    } catch (error) {
      return handleServiceError('Error retrieving emails', error);
    }
  }

  async getEmailDetails(request: any, emailReference: string): Promise<any> {
    try {
      const teamId = request.teamId;

      // Validate email exists and user has access
      const email = await this.emailsValidator.validateEmailAccess(emailReference, teamId);

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.successMessage,
        data: email,
      });
    } catch (error) {
      return handleServiceError('Error retrieving email details', error);
    }
  }

  async handleAwsSnsEvent(messageType: SnsMessageType, body: SnsMessageDto): Promise<any> {
    try {
      this.logger.log(`Processing AWS SNS event: ${messageType} \n details: ${JSON.stringify(body)}`);

      // Verify SNS signature for security (enabled in production)
      if (config.nodeEnv === 'production') {
        const isValid = await verifySnsSignature(body);
        if (!isValid) {
          this.logger.error('SNS signature verification failed');
          return generateSuccessResponse({
            statusCode: HttpStatus.FORBIDDEN,
            message: 'Invalid SNS signature',
            data: { processed: false },
          });
        }
      }

      // Handle SNS subscription confirmation
      if (messageType === 'SubscriptionConfirmation') {
        return await this.handleSubscriptionConfirmation(body);
      }

      // Handle SNS notification
      if (messageType === 'Notification') {
        return await this.handleSnsNotification(body);
      }

      // Handle unsubscribe confirmation
      if (messageType === 'UnsubscribeConfirmation') {
        this.logger.warn('SNS unsubscribed:', body.TopicArn);
        return generateSuccessResponse({
          statusCode: HttpStatus.OK,
          message: 'Unsubscribe confirmation received',
          data: { processed: true },
        });
      }

      // Unknown message type
      this.logger.warn(`Unknown SNS message type: ${messageType}`);
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'Unknown message type',
        data: { processed: false },
      });
    } catch (error) {
      this.logger.error(`Error processing AWS SNS event: ${error.message}`, error.stack);
      return handleServiceError('Error processing AWS SNS event', error);
    }
  }

  /**
   * Handles SNS subscription confirmation
   * Actually confirms the subscription by calling the SubscribeURL
   */
  private async handleSubscriptionConfirmation(body: any): Promise<any> {
    try {
      this.logger.log('SNS Subscription confirmation received');

      if (!body.SubscribeURL) {
        this.logger.warn('Missing SubscribeURL in subscription message');
        return generateSuccessResponse({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Missing SubscribeURL',
          data: { confirmed: false },
        });
      }

      // Confirm the subscription by calling the SubscribeURL
      this.logger.log('Confirming SNS subscription...');
      await this.makeHttpsGetRequest(body.SubscribeURL);
      this.logger.log('SNS subscription confirmed successfully');

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'Subscription confirmed successfully',
        data: { confirmed: true },
      });
    } catch (error) {
      this.logger.error(`Error confirming SNS subscription: ${error.message}`, error.stack);
      return handleServiceError('Error confirming SNS subscription', error);
    }
  }

  /**
   * Makes an HTTPS GET request using native Node.js https module
   */
  private makeHttpsGetRequest(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Request failed with status code: ${res.statusCode}`));
          return;
        }

        // Consume response data to free up memory
        res.on('data', () => {});
        res.on('end', () => resolve());
      }).on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Handles SNS notification containing SES events
   */
  private async handleSnsNotification(body: SnsMessageDto): Promise<any> {
    try {
      const message: SesCombinedMessageDto = typeof body.Message === 'string' ? JSON.parse(body.Message) : body.Message;

      // Support both Event Publishing (eventType) and SNS Notifications (notificationType)
      const eventType = ('eventType' in message ? message.eventType : message.notificationType);

      this.logger.log(`SNS Notification received: ${eventType}`);

      // Process different SES event types
      switch (eventType) {
        case 'Delivery':
          await this.handleDeliveryEvent(message as any);
          break;

        case 'Bounce':
          await this.handleBounceEvent(message as any);
          break;

        case 'Complaint':
          await this.handleComplaintEvent(message as any);
          break;

        case 'Open':
          await this.handleOpenEvent(message as any);
          break;

        case 'Click':
          await this.handleClickEvent(message as any);
          break;

        case 'Send':
          await this.handleSendEvent(message as any);
          break;

        case 'Reject':
          await this.handleRejectEvent(message as any);
          break;

        case 'Rendering Failure':
          await this.handleRenderingFailureEvent(message as any);
          break;

        case 'DeliveryDelay':
          await this.handleDeliveryDelayEvent(message as any);
          break;

        case 'Subscription':
          await this.handleSubscriptionEvent(message as any);
          break;

        default:
          this.logger.warn(`Unknown SES event type: ${eventType}`);
      }

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'Event processed successfully',
        data: { processed: true },
      });
    } catch (error) {
      this.logger.error(`Error handling SNS notification: ${error.message}`, error.stack);
      return handleServiceError('Error handling SNS notification', error);
    }
  }

  /**
   * Handle Delivery event
   */
  private async handleDeliveryEvent(message: any): Promise<void> {
    await this.emailEventQueue.add('email-delivered', {
      messageId: message.mail?.messageId,
      timestamp: message.delivery?.timestamp,
      recipients: message.delivery?.recipients,
      processingTimeMillis: message.delivery?.processingTimeMillis,
      smtpResponse: message.delivery?.smtpResponse,
      metadata: message,
    });
  }

  /**
   * Handle Bounce event
   */
  private async handleBounceEvent(message: any): Promise<void> {
    await this.emailEventQueue.add('email-bounced', {
      messageId: message.mail?.messageId,
      bounceType: message.bounce?.bounceType,
      bounceSubType: message.bounce?.bounceSubType,
      bouncedRecipients: message.bounce?.bouncedRecipients,
      timestamp: message.bounce?.timestamp,
      feedbackId: message.bounce?.feedbackId,
      metadata: message,
    });
  }

  /**
   * Handle Complaint event
   */
  private async handleComplaintEvent(message: any): Promise<void> {
    await this.emailEventQueue.add('email-complained', {
      messageId: message.mail?.messageId,
      complainedRecipients: message.complaint?.complainedRecipients,
      complaintFeedbackType: message.complaint?.complaintFeedbackType,
      timestamp: message.complaint?.timestamp,
      feedbackId: message.complaint?.feedbackId,
      metadata: message,
    });
  }

  /**
   * Handle Open event
   * With our new architecture, each recipient gets a unique messageId
   * AWS SES now sends Open events with destination containing only the actual recipient
   */
  private async handleOpenEvent(message: any): Promise<void> {
    const messageId = message.mail?.messageId;
    const recipients = message.mail?.destination || [];

    // Since we send individual emails per recipient, destination should contain only one recipient
    // But we handle the array to be safe
    for (const recipient of recipients) {
      await this.emailEventQueue.add('email-opened', {
        messageId,
        recipient,
        timestamp: message.open?.timestamp,
        userAgent: message.open?.userAgent,
        ipAddress: message.open?.ipAddress,
        metadata: message,
      });
    }
  }

  /**
   * Handle Click event
   * With our new architecture, each recipient gets a unique messageId
   * AWS SES now sends Click events with destination containing only the actual recipient
   */
  private async handleClickEvent(message: any): Promise<void> {
    const messageId = message.mail?.messageId;
    const recipients = message.mail?.destination || [];

    // Since we send individual emails per recipient, destination should contain only one recipient
    // But we handle the array to be safe
    for (const recipient of recipients) {
      await this.emailEventQueue.add('email-clicked', {
        messageId,
        recipient,
        timestamp: message.click?.timestamp,
        userAgent: message.click?.userAgent,
        ipAddress: message.click?.ipAddress,
        link: message.click?.link,
        linkTags: message.click?.linkTags,
        metadata: message,
      });
    }
  }

  /**
   * Handle Send event
   */
  private async handleSendEvent(message: any): Promise<void> {
    await this.emailEventQueue.add('email-sent', {
      messageId: message.mail?.messageId,
      timestamp: message.mail?.timestamp,
      metadata: message,
    });
  }

  /**
   * Handle Reject event
   */
  private async handleRejectEvent(message: any): Promise<void> {
    await this.emailEventQueue.add('email-rejected', {
      messageId: message.mail?.messageId,
      reason: message.reject?.reason,
      metadata: message,
    });
  }

  /**
   * Handle Rendering Failure event
   */
  private async handleRenderingFailureEvent(message: any): Promise<void> {
    await this.emailEventQueue.add('email-rendering-failed', {
      messageId: message.mail?.messageId,
      templateName: message.failure?.templateName,
      errorMessage: message.failure?.errorMessage,
      metadata: message,
    });
  }

  /**
   * Handle Delivery Delay event
   */
  private async handleDeliveryDelayEvent(message: any): Promise<void> {
    await this.emailEventQueue.add('email-delivery-delayed', {
      messageId: message.mail?.messageId,
      timestamp: message.deliveryDelay?.timestamp,
      delayType: message.deliveryDelay?.delayType,
      delayedRecipients: message.deliveryDelay?.delayedRecipients,
      metadata: message,
    });
  }

  /**
   * Handle Subscription event
   */
  private async handleSubscriptionEvent(message: any): Promise<void> {
    await this.emailEventQueue.add('email-subscription-changed', {
      messageId: message.mail?.messageId,
      contactList: message.subscription?.contactList,
      timestamp: message.subscription?.timestamp,
      source: message.subscription?.source,
      newTopicPreferences: message.subscription?.newTopicPreferences,
      oldTopicPreferences: message.subscription?.oldTopicPreferences,
      metadata: message,
    });
  }
}
