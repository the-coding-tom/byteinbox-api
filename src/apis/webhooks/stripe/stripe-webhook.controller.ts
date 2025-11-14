import { Controller, Post, Req, Headers, RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { StripeWebhookService } from './stripe-webhook.service';

@Controller('webhooks/stripe')
export class StripeWebhookController {
  constructor(private readonly stripeWebhookService: StripeWebhookService) {}

  /**
   * Handle Stripe webhook events
   * POST /api/v1/webhooks/stripe
   */
  @Post()
  async handleWebhook(
    @Req() request: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!request.rawBody) {
      throw new Error('Request body is missing');
    }
    return this.stripeWebhookService.handleWebhook(request.rawBody, signature);
  }
}
