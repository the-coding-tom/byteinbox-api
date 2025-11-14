import { Injectable, HttpStatus } from '@nestjs/common';
import { generateSuccessResponse } from '../../utils/util';
import { handleServiceError } from '../../utils/error.util';
import { Constants } from '../../common/enums/generic.enum';
import { SubscriptionRepository } from '../../repositories/subscription.repository';
import { SubscriptionsValidator } from './subscriptions.validator';
import {
  CreateCheckoutSessionDto,
  ChangePlanDto,
} from './dto/subscriptions.dto';
import {
  createCheckoutSession,
  createPortalSession,
  changePlan as changeStripePlan,
  cancelSubscription as cancelStripeSubscription,
  listInvoices as listStripeInvoices,
} from '../../helpers/stripe.helper';
import { config } from '../../config/config';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly subscriptionsValidator: SubscriptionsValidator,
  ) { }

  /**
   * Get current subscription for team
   */
  async getSubscription(teamId: number): Promise<any> {
    try {
      const subscription = await this.subscriptionsValidator.validateGetSubscription(teamId);

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.retrievedSuccessfully,
        data: subscription,
      });
    } catch (error) {
      return handleServiceError('Error fetching subscription', error);
    }
  }

  /**
   * Create checkout session for new subscription
   */
  async createCheckoutSession(
    teamId: number,
    dto: CreateCheckoutSessionDto,
    userEmail: string,
  ): Promise<any> {
    try {
      const validatedData =
        await this.subscriptionsValidator.validateCreateCheckoutSession(dto);

      const successUrl = validatedData.successUrl || `${config.frontendUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = validatedData.cancelUrl || `${config.frontendUrl}/billing/cancelled`;

      // Create Stripe Checkout Session
      const session = await createCheckoutSession({
        customerEmail: userEmail,
        stripePriceId: validatedData.priceId,
        metadata: {
          teamId: teamId.toString(),
        },
        successUrl,
        cancelUrl,
      });

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'Checkout session created successfully',
        data: {
          checkoutUrl: session.url,
        },
      });
    } catch (error) {
      return handleServiceError('Error creating checkout session', error);
    }
  }

  /**
   * Change subscription plan (upgrade or downgrade with smart proration)
   */
  async changePlan(
    teamId: number,
    dto: ChangePlanDto,
  ): Promise<any> {
    try {
      const { validatedData, subscription, currentTier, newTier, isUpgrade } =
        await this.subscriptionsValidator.validateChangePlan(dto, teamId);

      // Change plan in Stripe with dynamic proration
      await changeStripePlan(
        subscription.stripeSubscriptionId,
        validatedData.newPriceId,
        isUpgrade,
      );

      const message = isUpgrade
        ? 'Plan upgraded successfully. Prorated invoice will be generated.'
        : 'Plan downgraded successfully. Changes will take effect at the end of the billing period.';

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message,
        data: {
          status: 'pending_invoice',
          changeType: isUpgrade ? 'upgrade' : 'downgrade',
          from: {
            tier: currentTier.name,
            rank: currentTier.rank,
          },
          to: {
            tier: newTier.name,
            rank: newTier.rank,
          },
          prorationApplied: isUpgrade,
        },
      });
    } catch (error) {
      return handleServiceError('Error changing subscription plan', error);
    }
  }

  /**
   * Cancel subscription (turns off auto-renewal, subscription remains active until period end)
   */
  async cancelSubscription(teamId: number): Promise<any> {
    try {
      const subscription = await this.subscriptionsValidator.validateCancelSubscription(teamId);

      // Cancel in Stripe (always at period end)
      await cancelStripeSubscription(subscription.stripeSubscriptionId, true);

      // Update local subscription
      await this.subscriptionRepository.cancel(subscription.id, true);

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'Auto-renewal turned off. Your subscription will remain active until the end of the current billing period.',
        data: {
          status: 'active',
          cancelAtPeriodEnd: true,
          currentPeriodEnd: subscription.currentPeriodEnd,
        },
      });
    } catch (error) {
      return handleServiceError('Error cancelling subscription', error);
    }
  }

  /**
   * Get billing portal session
   */
  async getPortalSession(teamId: number): Promise<any> {
    try {
      const subscription = await this.subscriptionsValidator.validateGetPortalSession(teamId);

      const session = await createPortalSession(
        subscription.stripeCustomerId,
        `${config.frontendUrl}/billing`,
      );

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'Portal session created successfully',
        data: {
          url: session.url,
        },
      });
    } catch (error) {
      return handleServiceError('Error creating portal session', error);
    }
  }

  /**
   * Get invoices for team
   */
  async getInvoices(teamId: number): Promise<any> {
    try {
      const subscription = await this.subscriptionsValidator.validateGetInvoices(teamId);

      const invoices = await listStripeInvoices(subscription.stripeCustomerId, 10);

      const formattedInvoices = invoices.map((invoice) => ({
        id: invoice.id,
        amount_paid: invoice.amount_paid,
        currency: invoice.currency,
        status: invoice.status,
        created: invoice.created,
        invoice_pdf: invoice.invoice_pdf,
        hosted_invoice_url: invoice.hosted_invoice_url,
      }));

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.retrievedSuccessfully,
        data: formattedInvoices,
      });
    } catch (error) {
      return handleServiceError('Error fetching invoices', error);
    }
  }
}
