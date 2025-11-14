import Stripe from 'stripe';
import prisma from '../../../../common/prisma';
import { SubscriptionStatus } from '@prisma/client';

export async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log(`[Stripe] Invoice payment failed: ${invoice.id}`);

  const subscriptionId = (() => {
    const subscriptionDetails = invoice.parent?.subscription_details;
    if (!subscriptionDetails) return undefined;

    const { subscription } = subscriptionDetails;
    if (typeof subscription === 'string') return subscription;
    return subscription?.id;
  })();

  if (!subscriptionId) return;

  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (!subscription) {
    console.warn(
      '[Stripe] Subscription not found for invoice:',
      subscriptionId,
    );
    return;
  }

  // Mark subscription as past due
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: SubscriptionStatus.PAST_DUE,
    },
  });

  // TODO: Send notification to user about failed payment

  console.log(`[Stripe] Subscription marked as PAST_DUE for ${subscription.id}`);
}
