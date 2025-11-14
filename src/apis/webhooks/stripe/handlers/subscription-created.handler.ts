import Stripe from 'stripe';
import prisma from '../../../../common/prisma';
import { SubscriptionStatus } from '@prisma/client';
import {
  getSubscriptionPeriodBounds,
  retrieveSubscription,
} from '../../../../helpers/stripe.helper';

export async function handleSubscriptionCreated(
  stripeSubscription: Stripe.Subscription,
) {
  console.log(`[Stripe] Subscription created: ${stripeSubscription.id}`);

  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: stripeSubscription.id },
  });

  if (!subscription) {
    console.warn(
      '[Stripe] Subscription not found in database:',
      stripeSubscription.id,
    );
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
    },
  });
}
