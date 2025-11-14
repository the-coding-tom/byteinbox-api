import Stripe from 'stripe';
import prisma from '../../../../common/prisma';
import { SubscriptionStatus } from '@prisma/client';
import {
  getSubscriptionPeriodBounds,
  retrieveSubscription,
} from '../../../../helpers/stripe.helper';

export async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
) {
  console.log(`[Stripe] Checkout session completed: ${session.id}`);

  const metadata = (session.metadata ?? {}) as Stripe.Metadata;
  const teamIdValue = metadata.teamId;

  if (!teamIdValue) {
    console.error('[Stripe] No teamId provided in checkout session metadata');
    return;
  }

  const teamId = parseInt(teamIdValue, 10);

  if (Number.isNaN(teamId)) {
    console.error('[Stripe] Invalid teamId in checkout session metadata:', teamIdValue);
    return;
  }

  const stripeSubscriptionId =
    typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id;

  if (!stripeSubscriptionId) {
    console.error('[Stripe] No subscription ID found on checkout session');
    return;
  }

  const stripeCustomerId =
    typeof session.customer === 'string'
      ? session.customer
      : session.customer?.id;

  if (!stripeCustomerId) {
    console.error('[Stripe] No customer ID found on checkout session');
    return;
  }

  const stripeSubscription = await retrieveSubscription(stripeSubscriptionId, {
    expand: ['items.data'],
  });

  const { currentPeriodStart, currentPeriodEnd } =
    getSubscriptionPeriodBounds(stripeSubscription);

  // Update subscription with Stripe IDs
  const subscription = await prisma.subscription.findFirst({
    where: {
      teamId,
      status: SubscriptionStatus.INCOMPLETE,
    },
  });

  if (!subscription) {
    console.error(
      '[Stripe] No incomplete subscription found for team:',
      teamId,
    );
    return;
  }

  // Get subscription details from Stripe
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: SubscriptionStatus.ACTIVE,
      stripeSubscriptionId,
      stripeCustomerId,
      ...(currentPeriodStart ? { currentPeriodStart } : {}),
      ...(currentPeriodEnd ? { currentPeriodEnd } : {}),
    },
  });

  console.log(`[Stripe] Subscription activated for team ${teamId}`);
}
