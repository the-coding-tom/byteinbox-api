import { SubscriptionStatus, BillingInterval } from '@prisma/client';

export interface CreateSubscriptionData {
  teamId: number;
  planId: number;
  planTierId?: number;
  status: SubscriptionStatus;
  billingInterval: BillingInterval;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePaymentMethodId?: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialStart?: Date;
  trialEnd?: Date;
}

export interface UpdateSubscriptionData {
  planId?: number;
  planTierId?: number;
  status?: SubscriptionStatus;
  billingInterval?: BillingInterval;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePaymentMethodId?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  canceledAt?: Date;
  trialStart?: Date;
  trialEnd?: Date;
  emailsSentThisMonth?: number;
  emailsSentToday?: number;
  lastUsageReset?: Date;
  lastDailyReset?: Date;
}
