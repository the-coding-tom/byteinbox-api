import Stripe from 'stripe';
import prisma from '../../../../common/prisma';

export async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log(`[Stripe] Invoice payment succeeded: ${invoice.id}`);

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

  // Reset monthly usage on successful payment (new billing period)
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      emailsSentThisMonth: 0,
      lastUsageReset: new Date(),
    },
  });

  console.log(`[Stripe] Monthly usage reset for subscription ${subscription.id}`);
}
