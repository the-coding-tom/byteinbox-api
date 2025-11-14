import { Injectable, HttpStatus } from '@nestjs/common';
import { generateSuccessResponse } from '../../../utils/util';
import { handleServiceError } from '../../../utils/error.util';
import { verifyWebhookSignature } from '../../../helpers/stripe.helper';
import { config } from '../../../config/config';
import Stripe from 'stripe';

// Import handlers
import { handleCheckoutSessionCompleted } from './handlers/checkout-session-completed.handler';
import { handleSubscriptionCreated } from './handlers/subscription-created.handler';
import { handleSubscriptionUpdated } from './handlers/subscription-updated.handler';
import { handleSubscriptionDeleted } from './handlers/subscription-deleted.handler';
import { handleInvoicePaymentSucceeded } from './handlers/invoice-payment-succeeded.handler';
import { handleInvoicePaymentFailed } from './handlers/invoice-payment-failed.handler';

@Injectable()
export class StripeWebhookService {
  async handleWebhook(rawBody: Buffer, signature: string): Promise<any> {
    try {
      // Verify webhook signature
      const event = verifyWebhookSignature(
        rawBody,
        signature,
        config.stripe.webhookSecret,
      );

      console.log(`[Stripe Webhook] Received event: ${event.type}`);

      // Route to appropriate handler
      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutSessionCompleted(
            event.data.object as Stripe.Checkout.Session,
          );
          break;

        case 'customer.subscription.created':
          await handleSubscriptionCreated(
            event.data.object as Stripe.Subscription,
          );
          break;

        case 'customer.subscription.updated':
          await handleSubscriptionUpdated(
            event.data.object as Stripe.Subscription,
          );
          break;

        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(
            event.data.object as Stripe.Subscription,
          );
          break;

        case 'invoice.payment_succeeded':
          await handleInvoicePaymentSucceeded(
            event.data.object as Stripe.Invoice,
          );
          break;

        case 'invoice.payment_failed':
          await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        default:
          console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
      }

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'Webhook processed successfully',
        data: { received: true },
      });
    } catch (error) {
      console.error('[Stripe Webhook] Error:', error);
      return handleServiceError('Webhook processing failed', error);
    }
  }
}
