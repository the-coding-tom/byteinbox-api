import { Injectable, HttpStatus } from '@nestjs/common';
import { WebhooksValidator } from './webhooks.validator';
import { WebhookRepository } from '../../repositories/webhook.repository';
import { generateSuccessResponse } from '../../utils/util';
import { handleServiceError } from '../../utils/error.util';
import { Constants } from '../../common/enums/generic.enum';
import { generateSigningSecret } from '../../helpers/webhook.helper';
import {
  CreateWebhookDto,
  UpdateWebhookDto,
} from './dto/webhooks.dto';

@Injectable()
export class WebhooksService {
  constructor(
    private readonly webhooksValidator: WebhooksValidator,
    private readonly webhookRepository: WebhookRepository,
  ) {}

  async createWebhook(userId: number, createWebhookDto: CreateWebhookDto, request: any): Promise<any> {
    try {
      const { validatedData } = await this.webhooksValidator.validateCreateWebhook(
        request.user.teamId,
        userId,
        createWebhookDto,
      );

      // Generate signing secret
      const signingSecret = generateSigningSecret();

      // Create webhook in repository
      const webhook = await this.webhookRepository.create(
        {
          url: validatedData.endpoint,
          events: validatedData.events,
          teamId: validatedData.teamId,
          createdBy: validatedData.userId,
        },
        signingSecret,
      );

      return generateSuccessResponse({
        statusCode: HttpStatus.CREATED,
        message: Constants.createdSuccessfully,
        data: {
          id: webhook.id,
          signingSecret: webhook.signingSecret,
        },
      });
    } catch (error) {
      return handleServiceError(error, 'Error creating webhook');
    }
  }

  async getWebhooks(userId: number, request: any): Promise<any> {
    try {
      const { validatedData } = await this.webhooksValidator.validateGetWebhooks(
        request.user.teamId,
      );

      // Fetch all webhooks for the team
      const webhooks = await this.webhookRepository.findAll(validatedData.teamId);

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.retrievedSuccessfully,
        data: webhooks,
      });
    } catch (error) {
      return handleServiceError(error, 'Error retrieving webhooks');
    }
  }

  async getWebhookDetails(webhookId: string, userId: number, request: any): Promise<any> {
    try {
      const { validatedData } = await this.webhooksValidator.validateGetWebhookDetails(
        request.user.teamId,
        webhookId,
      );

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.retrievedSuccessfully,
        data: validatedData.webhook,
      });
    } catch (error) {
      return handleServiceError(error, 'Error retrieving webhook details');
    }
  }

  async updateWebhook(webhookId: string, userId: number, updateWebhookDto: UpdateWebhookDto, request: any): Promise<any> {
    try {
      const { validatedData } = await this.webhooksValidator.validateUpdateWebhook(
        request.user.teamId,
        webhookId,
        updateWebhookDto,
      );

      // Update webhook in repository
      const webhook = await this.webhookRepository.update(
        validatedData.webhookId,
        validatedData.teamId,
        {
          url: validatedData.endpoint,
          events: validatedData.events,
          status: validatedData.status,
        },
      );

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.updatedSuccessfully,
        data: {
          id: webhook.id,
        },
      });
    } catch (error) {
      return handleServiceError(error, 'Error updating webhook');
    }
  }

  async deleteWebhook(webhookId: string, userId: number, request: any): Promise<any> {
    try {
      const { validatedData } = await this.webhooksValidator.validateDeleteWebhook(
        request.user.teamId,
        webhookId,
      );

      // Delete webhook from repository
      const webhook = await this.webhookRepository.delete(
        validatedData.webhookId,
        validatedData.teamId,
      );

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.deletedSuccessfully,
        data: {
          id: webhook.id,
        },
      });
    } catch (error) {
      return handleServiceError(error, 'Error deleting webhook');
    }
  }
}
