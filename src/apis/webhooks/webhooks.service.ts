import { Injectable } from '@nestjs/common';
import { WebhooksValidator } from './webhooks.validator';
import { generateSuccessResponse } from '../../utils/util';
import { handleServiceError } from '../../utils/error.util';
import { Constants } from '../../common/enums/generic.enum';
import { config } from '../../config/config';
import { 
  CreateWebhookDto, 
  WebhookFilterDto,
  CreateWebhookResponseDto, 
  GetWebhooksResponseDto, 
  GetWebhookDetailsResponseDto, 
  UpdateWebhookDto, 
  UpdateWebhookResponseDto, 
  DeleteWebhookResponseDto, 
  TestWebhookResponseDto, 
  GetWebhookDeliveriesResponseDto,
  ToggleWebhookStatusDto,
  ToggleWebhookStatusResponseDto,
  GetWebhookEventsResponseDto
} from './dto/webhooks.dto';

@Injectable()
export class WebhooksService {
  constructor(
    private readonly webhooksValidator: WebhooksValidator,
  ) {}

  async createWebhook(userId: number, createWebhookDto: CreateWebhookDto, request: any): Promise<any> {
    try {
      // Validate input data
      await this.webhooksValidator.validateCreateWebhook(createWebhookDto);

      // Dummy response - in real implementation, this would create a webhook
      const response: CreateWebhookResponseDto = {
        webhook: {
          id: 'webhook_123',
          url: createWebhookDto.url,
          events: createWebhookDto.events,
          status: createWebhookDto.status || 'enabled',
          secret: 'whsec_' + Math.random().toString(36).substring(2, 15),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      return generateSuccessResponse({
        statusCode: 201,
        message: Constants.createdSuccessfully,
        data: response,
      });
    } catch (error) {
      return handleServiceError(error, 'Error creating webhook');
    }
  }

  async getWebhooks(userId: number, filter: WebhookFilterDto): Promise<any> {
    try {
      // Set defaults from config
      const page = filter.page || config.validation.pagination.defaultPage;
      const limit = filter.limit || config.validation.pagination.defaultLimit;
      
      // Dummy response - in real implementation, this would fetch user's webhooks with pagination
      const response: GetWebhooksResponseDto = {
        webhooks: [
          {
            id: 'webhook_123',
            url: 'https://example.com/webhook',
            events: ['email.sent', 'email.delivered'],
            status: 'enabled',
            lastTriggered: '2024-01-15T10:00:00Z',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-15T10:00:00Z',
          },
          {
            id: 'webhook_456',
            url: 'https://another-example.com/webhook',
            events: ['email.opened', 'email.clicked'],
            status: 'enabled',
            lastTriggered: '2024-01-14T15:30:00Z',
            createdAt: '2024-01-05T00:00:00Z',
            updatedAt: '2024-01-14T15:30:00Z',
          },
        ],
        meta: {
          page,
          limit,
          total: 2,
          totalPages: 1,
        },
      };

      return generateSuccessResponse({
        statusCode: 200,
        message: Constants.retrievedSuccessfully,
        data: response,
      });
    } catch (error) {
      return handleServiceError(error, 'Error retrieving webhooks');
    }
  }

  async getWebhookDetails(webhookId: string, userId: number): Promise<any> {
    try {
      // Dummy response - in real implementation, this would fetch webhook details with deliveries
      const response: GetWebhookDetailsResponseDto = {
        webhook: {
          id: webhookId,
          url: 'https://example.com/webhook',
          events: ['email.sent', 'email.delivered'],
          status: 'enabled',
          secret: 'whsec_' + Math.random().toString(36).substring(2, 15),
          lastTriggered: '2024-01-15T10:00:00Z',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
          deliveries: [
            {
              id: 'delivery_123',
              eventType: 'email.sent',
              messageId: 'msg_123',
              status: 'success',
              attempts: 1,
              createdAt: '2024-01-15T10:00:00Z',
              completedAt: '2024-01-15T10:00:01Z',
            },
            {
              id: 'delivery_456',
              eventType: 'email.delivered',
              messageId: 'msg_123',
              status: 'success',
              attempts: 1,
              createdAt: '2024-01-15T10:01:00Z',
              completedAt: '2024-01-15T10:01:01Z',
            },
          ],
        },
      };

      return generateSuccessResponse({
        statusCode: 200,
        message: Constants.retrievedSuccessfully,
        data: response,
      });
    } catch (error) {
      return handleServiceError(error, 'Error retrieving webhook details');
    }
  }

  async updateWebhook(webhookId: string, userId: number, updateWebhookDto: UpdateWebhookDto, request: any): Promise<any> {
    try {
      // Validate input data
      await this.webhooksValidator.validateUpdateWebhook(updateWebhookDto);

      // Dummy response - in real implementation, this would update the webhook
      const response: UpdateWebhookResponseDto = {
        webhook: {
          id: webhookId,
          url: updateWebhookDto.url || 'https://example.com/webhook',
          events: updateWebhookDto.events || ['email.sent', 'email.delivered'],
          status: updateWebhookDto.status || 'enabled',
          secret: 'whsec_' + Math.random().toString(36).substring(2, 15),
          lastTriggered: '2024-01-15T10:00:00Z',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: new Date().toISOString(),
        },
      };

      return generateSuccessResponse({
        statusCode: 200,
        message: Constants.updatedSuccessfully,
        data: response,
      });
    } catch (error) {
      return handleServiceError(error, 'Error updating webhook');
    }
  }

  async deleteWebhook(webhookId: string, userId: number, request: any): Promise<any> {
    try {
      // Dummy response - in real implementation, this would delete the webhook
      const response: DeleteWebhookResponseDto = {
        message: Constants.deletedSuccessfully,
      };

      return generateSuccessResponse({
        statusCode: 200,
        message: Constants.deletedSuccessfully,
        data: response,
      });
    } catch (error) {
      return handleServiceError(error, 'Error deleting webhook');
    }
  }

  async testWebhook(webhookId: string, userId: number, request: any): Promise<any> {
    try {
      // Dummy response - in real implementation, this would send a test webhook
      const response: TestWebhookResponseDto = {
        message: Constants.successMessage,
        delivery: {
          id: 'delivery_test_123',
          status: 'success',
          response: {
            statusCode: 200,
            body: 'OK',
          },
          createdAt: new Date().toISOString(),
        },
      };

      return generateSuccessResponse({
        statusCode: 200,
        message: Constants.successMessage,
        data: response,
      });
    } catch (error) {
      return handleServiceError(error, 'Error testing webhook');
    }
  }

  async getWebhookDeliveries(webhookId: string, userId: number, filter: WebhookFilterDto): Promise<any> {
    try {
      // Set defaults from config
      const page = filter.page || config.validation.pagination.defaultPage;
      const limit = filter.limit || config.validation.pagination.defaultLimit;
      
      // Dummy response - in real implementation, this would fetch webhook deliveries with pagination
      const response: GetWebhookDeliveriesResponseDto = {
        deliveries: [
          {
            id: 'delivery_123',
            eventType: 'email.sent',
            messageId: 'msg_123',
            status: 'success',
            attempts: 1,
            createdAt: '2024-01-15T10:00:00Z',
            completedAt: '2024-01-15T10:00:01Z',
            request: {
              method: 'POST',
              url: 'https://example.com/webhook',
              headers: {
                'Content-Type': 'application/json',
                'X-Webhook-Signature': 'sha256=...',
              },
              body: {
                event: 'email.sent',
                data: {
                  emailId: 'email_123',
                  messageId: 'msg_123',
                },
              },
            },
            response: {
              statusCode: 200,
              body: 'OK',
            },
          },
        ],
        meta: {
          page,
          limit,
          total: 1,
          totalPages: 1,
        },
      };

      return generateSuccessResponse({
        statusCode: 200,
        message: Constants.retrievedSuccessfully,
        data: response,
      });
    } catch (error) {
      return handleServiceError(error, 'Error retrieving webhook deliveries');
    }
  }

  async toggleWebhookStatus(webhookId: string, userId: number, toggleWebhookStatusDto: ToggleWebhookStatusDto, request: any): Promise<any> {
    try {
      // Validate input data
      await this.webhooksValidator.validateToggleWebhookStatus(toggleWebhookStatusDto);

      // Dummy response - in real implementation, this would toggle webhook status
      const response: ToggleWebhookStatusResponseDto = {
        webhook: {
          id: webhookId,
          url: 'https://example.com/webhook',
          status: toggleWebhookStatusDto.status,
          updatedAt: new Date().toISOString(),
        },
      };

      return generateSuccessResponse({
        statusCode: 200,
        message: `Webhook ${toggleWebhookStatusDto.status} successfully`,
        data: response,
      });
    } catch (error) {
      return handleServiceError(error, 'Error toggling webhook status');
    }
  }

  async getWebhookEvents(): Promise<any> {
    try {
      // Dummy response - in real implementation, this would fetch available webhook events
      const response: GetWebhookEventsResponseDto = {
        events: [
          {
            value: 'email.sent',
            label: 'Email Sent',
            description: 'Triggered when an email is successfully sent',
            enabled: true,
          },
          {
            value: 'email.delivered',
            label: 'Email Delivered',
            description: 'Triggered when an email is delivered to the recipient',
            enabled: true,
          },
          {
            value: 'email.opened',
            label: 'Email Opened',
            description: 'Triggered when an email is opened by the recipient',
            enabled: true,
          },
          {
            value: 'email.clicked',
            label: 'Email Clicked',
            description: 'Triggered when a link in an email is clicked',
            enabled: true,
          },
          {
            value: 'email.bounced',
            label: 'Email Bounced',
            description: 'Triggered when an email bounces',
            enabled: true,
          },
          {
            value: 'email.complained',
            label: 'Email Complained',
            description: 'Triggered when a recipient marks an email as spam',
            enabled: true,
          },
          {
            value: 'broadcast.sent',
            label: 'Broadcast Sent',
            description: 'Triggered when a broadcast is sent',
            enabled: true,
          },
          {
            value: 'contact.subscribed',
            label: 'Contact Subscribed',
            description: 'Triggered when a contact subscribes',
            enabled: true,
          },
          {
            value: 'contact.unsubscribed',
            label: 'Contact Unsubscribed',
            description: 'Triggered when a contact unsubscribes',
            enabled: true,
          },
        ],
      };

      return generateSuccessResponse({
        statusCode: 200,
        message: Constants.retrievedSuccessfully,
        data: response,
      });
    } catch (error) {
      return handleServiceError(error, 'Error retrieving webhook events');
    }
  }
}
