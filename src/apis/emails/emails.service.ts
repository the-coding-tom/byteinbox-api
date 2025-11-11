import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { v4 as uuidv4 } from 'uuid';
import { EmailsValidator } from './emails.validator';
import { generateSuccessResponse } from '../../utils/util';
import { handleServiceError } from '../../utils/error.util';
import { Constants } from '../../common/enums/generic.enum';
import { EMAIL_ROUTER_QUEUE } from '../../common/constants/queues.constant';
import { EmailRepository } from '../../repositories/email.repository';
import { DomainRepository } from '../../repositories/domain.repository';
import { TemplateRepository } from '../../repositories/template.repository';
import { SendEmailDto, EmailFilterDto } from './dto/emails.dto';
import { config } from '../../config/config';
import { extractDomainFromEmail } from '../../utils/email.util';

@Injectable()
export class EmailsService {
  constructor(
    private readonly emailsValidator: EmailsValidator,
    private readonly emailRepository: EmailRepository,
    private readonly domainRepository: DomainRepository,
    private readonly templateRepository: TemplateRepository,
    @InjectQueue(EMAIL_ROUTER_QUEUE) private readonly emailRouterQueue: Queue,
  ) { }

  async sendEmail(request: any, sendEmailDto: SendEmailDto): Promise<any> {
    try {
      const userId = request.user.id;
      const teamId = request.teamId;

      // Validate input data, extract domain, and verify domain (including template if provided)
      const { domain, templateId } = await this.emailsValidator.validateSendEmail(sendEmailDto, teamId);

      // Store email with attachments - downloads from path happen in queue processor
      // Template rendering happens in EMAIL_TEMPLATE queue processor
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
          templateId,
          templateData: sendEmailDto.variables,
        },
        sendEmailDto.attachments as any[]
      );

      // Enqueue email for routing (router will determine next step)
      await this.emailRouterQueue.add(
        'route-email',
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

  async sendBatchEmail(request: any, emails: SendEmailDto[]): Promise<any> {
    try {
      const userId = request.user.id;
      const teamId = request.teamId;

      // Step 1: Validate batch structure and schema
      await this.emailsValidator.validateSendBatchEmail(emails);

      // Generate unique batch reference for this batch
      const batchReference = uuidv4();

      // Step 2: Extract unique domains from all emails
      const uniqueDomains = [...new Set(
        emails.map(email => extractDomainFromEmail(email.from)).filter(Boolean)
      )] as string[];

      // Step 3: Bulk validate all domains with single DB query
      const verifiedDomainsMap = await this.domainRepository.findVerifiedDomainsByNamesAndTeam(
        uniqueDomains,
        teamId
      );

      // Step 3b: Extract unique templates and bulk validate them
      const uniqueTemplates = [...new Set(
        emails.map(email => email.template).filter(Boolean)
      )] as string[];

      let publishedTemplatesMap: Record<string, { id: number; name: string; reference: string }> = {};
      if (uniqueTemplates.length > 0) {
        publishedTemplatesMap = await this.templateRepository.findPublishedTemplatesByNamesAndTeam(
          uniqueTemplates,
          teamId
        );
      }

      // Step 4: Map emails to repository data structure with domain and template validation
      const emailsData = emails.map((sendEmailDto) => {
        const domainName = extractDomainFromEmail(sendEmailDto.from);

        if (!domainName) {
          throw new Error(`Invalid from address format: ${sendEmailDto.from}`);
        }

        const domain = verifiedDomainsMap[domainName];
        if (!domain) {
          throw new Error(
            `Domain '${domainName}' not found or not verified. Please add and verify it first.`
          );
        }

        // Validate template if provided
        let templateId: number | undefined;
        if (sendEmailDto.template) {
          const template = publishedTemplatesMap[sendEmailDto.template];
          if (!template) {
            throw new Error(
              `Template '${sendEmailDto.template}' not found or has no published version.`
            );
          }
          templateId = template.id;
        }

        return {
          email: {
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
            templateId,
            templateData: sendEmailDto.variables,
          },
          attachments: sendEmailDto.attachments as any[] || [],
        };
      });

      // Create all emails in a single transaction
      const results = await this.emailRepository.createBatchEmailsWithAttachments(
        batchReference,
        emailsData
      );

      // Fetch email IDs and enqueue for routing
      const emailIds = await this.emailRepository.findEmailIdsByBatchReference(batchReference);

      await Promise.all(
        emailIds.map((emailId) =>
          this.emailRouterQueue.add(
            'route-email',
            { emailId },
            {
              attempts: config.queue.jobRetryAttempts,
              backoff: {
                type: 'exponential',
                delay: config.queue.jobRetryDelayMs,
              },
            }
          )
        )
      );

      return generateSuccessResponse({
        statusCode: HttpStatus.CREATED,
        message: Constants.successMessage,
        data: results,
      });
    } catch (error) {
      return handleServiceError('Error sending batch emails', error);
    }
  }

  async updateScheduledEmail(request: any, reference: string, updateData: { scheduledAt: string }): Promise<any> {
    try {
      const teamId = request.teamId;

      // Validate schema, email exists, team access, and scheduled status
      await this.emailsValidator.validateUpdateScheduledEmail(reference, updateData, teamId);

      // Parse date
      const scheduledAtDate = new Date(updateData.scheduledAt);

      // Update email
      const result = await this.emailRepository.updateScheduledAt(reference, scheduledAtDate);

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.successMessage,
        data: result,
      });
    } catch (error) {
      return handleServiceError('Error updating scheduled email', error);
    }
  }

  async cancelScheduledEmail(request: any, reference: string): Promise<any> {
    try {
      const teamId = request.teamId;

      // Validate email exists, team access, and scheduled status
      await this.emailsValidator.validateCancelScheduledEmail(reference, teamId);

      // Cancel scheduled email
      const result = await this.emailRepository.cancelScheduledEmail(reference);

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.successMessage,
        data: result,
      });
    } catch (error) {
      return handleServiceError('Error canceling scheduled email', error);
    }
  }

  async getAttachment(request: any, emailReference: string, attachmentReference: string): Promise<any> {
    try {
      const teamId = request.teamId;

      // Validate email exists, team access, and attachment exists
      await this.emailsValidator.validateGetAttachment(attachmentReference, emailReference, teamId);

      // Fetch attachment details
      const attachment = await this.emailRepository.findAttachmentByReference(
        attachmentReference,
        emailReference,
        teamId
      );

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.successMessage,
        data: attachment,
      });
    } catch (error) {
      return handleServiceError('Error fetching attachment', error);
    }
  }

  async getAttachments(request: any, emailReference: string): Promise<any> {
    try {
      const teamId = request.teamId;

      // Validate email exists and team access
      await this.emailsValidator.validateGetAttachments(emailReference, teamId);

      // Fetch all attachments for the email
      const attachments = await this.emailRepository.findAttachmentsByEmailReference(
        emailReference,
        teamId
      );

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.successMessage,
        data: attachments,
      });
    } catch (error) {
      return handleServiceError('Error fetching attachments', error);
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
}
