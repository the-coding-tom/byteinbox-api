import Stripe from 'stripe';
import prisma from '../../../../common/prisma';
import { SubscriptionStatus } from '@prisma/client';
import {
  getSubscriptionPeriodBounds,
  retrieveSubscription,
} from '../../../../helpers/stripe.helper';

export async function handleSubscriptionUpdated(
  stripeSubscription: Stripe.Subscription,
) {
  console.log(`[Stripe] Subscription updated: ${stripeSubscription.id}`);

  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: stripeSubscription.id },
  });

  if (!subscription) {
    console.warn('[Stripe] Subscription not found:', stripeSubscription.id);
    return;
  }

  let { currentPeriodStart, currentPeriodEnd } =
    getSubscriptionPeriodBounds(stripeSubscription);

  if (!currentPeriodStart || !currentPeriodEnd) {
    const expandedSubscription = await retrieveSubscription(
      stripeSubscription.id,
      { expand: ['items.data'] },
    );
    const bounds = getSubscriptionPeriodBounds(expandedSubscription);
    currentPeriodStart = currentPeriodStart ?? bounds.currentPeriodStart;
    currentPeriodEnd = currentPeriodEnd ?? bounds.currentPeriodEnd;
  }

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: stripeSubscription.status.toUpperCase() as SubscriptionStatus,
      ...(currentPeriodStart ? { currentPeriodStart } : {}),
      ...(currentPeriodEnd ? { currentPeriodEnd } : {}),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    },
  });

  console.log(`[Stripe] Subscription updated for ${subscription.id}`);
}
