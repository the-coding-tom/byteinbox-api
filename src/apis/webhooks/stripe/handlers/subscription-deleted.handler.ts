import Stripe from 'stripe';
import prisma from '../../../../common/prisma';
import { SubscriptionStatus } from '@prisma/client';

export async function handleSubscriptionDeleted(
  stripeSubscription: Stripe.Subscription,
) {
  console.log(`[Stripe] Subscription deleted: ${stripeSubscription.id}`);

  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: stripeSubscription.id },
  });

  if (!subscription) {
    console.warn('[Stripe] Subscription not found:', stripeSubscription.id);
    return;
  }

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: SubscriptionStatus.CANCELED,
      canceledAt: new Date(),
    },
  });

  console.log(`[Stripe] Subscription cancelled for ${subscription.id}`);
}
