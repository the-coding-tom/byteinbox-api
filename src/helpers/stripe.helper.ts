import Stripe from 'stripe';
import { config } from '../config/config';

// Initialize Stripe
const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: Stripe.API_VERSION as Stripe.LatestApiVersion,
  typescript: true,
});

export { stripe };

/**
 * Create Stripe checkout session for subscription
 */
export async function createCheckoutSession(params: {
  customerEmail: string;
  stripePriceId: string;
  metadata?: Record<string, string>;
  successUrl: string;
  cancelUrl: string;
  trialDays?: number;
}): Promise<Stripe.Checkout.Session> {
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    customer_email: params.customerEmail,
    line_items: [
      {
        price: params.stripePriceId,
        quantity: 1,
      },
    ],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    allow_promotion_codes: true,
    billing_address_collection: 'required',
  };

  // Add metadata if provided
  if (params.metadata) {
    sessionParams.metadata = params.metadata;
  }

  // Add trial period if specified
  if (params.trialDays && params.trialDays > 0) {
    sessionParams.subscription_data = {
      trial_period_days: params.trialDays,
    };
  }

  return await stripe.checkout.sessions.create(sessionParams);
}

/**
 * Create Stripe customer portal session
 */
export async function createPortalSession(
  customerId: string,
  returnUrl: string,
): Promise<Stripe.BillingPortal.Session> {
  return await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

/**
 * Update Stripe subscription
 */
export async function updateSubscription(
  subscriptionId: string,
  params: Stripe.SubscriptionUpdateParams,
): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.update(subscriptionId, params);
}

/**
 * Cancel Stripe subscription (always at period end)
 * Turns off auto-renewal but keeps subscription active until expiration
 */
export async function cancelSubscription(
  subscriptionId: string,
  cancelAtPeriodEnd: boolean = true,
): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

/**
 * Change subscription plan with dynamic proration
 * @param subscriptionId - Stripe subscription ID
 * @param newPriceId - New Stripe price ID
 * @param isUpgrade - Whether this is an upgrade (true) or downgrade (false)
 */
export async function changePlan(
  subscriptionId: string,
  newPriceId: string,
  isUpgrade: boolean,
): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const subscriptionItemId = subscription.items.data[0].id;

  // Upgrade: give immediate credit (prorate)
  // Downgrade: no credit given (no proration)
  const prorationBehavior = isUpgrade ? 'create_prorations' : 'none';

  return await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscriptionItemId,
        price: newPriceId,
      },
    ],
    proration_behavior: prorationBehavior,
  });
}

/**
 * List invoices for a customer
 */
export async function listInvoices(
  customerId: string,
  limit: number = 10,
): Promise<Stripe.Invoice[]> {
  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit,
  });
  return invoices.data;
}

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string,
): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

/**
 * Retrieve Stripe subscription
 */
export async function retrieveSubscription(
  subscriptionId: string,
  params?: Stripe.SubscriptionRetrieveParams,
): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.retrieve(subscriptionId, params);
}

/**
 * Retrieve Stripe customer
 */
export async function retrieveCustomer(
  customerId: string,
): Promise<Stripe.Customer> {
  return await stripe.customers.retrieve(customerId) as Stripe.Customer;
}

export function getSubscriptionPeriodBounds(
  subscription: Stripe.Subscription,
): {
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
} {
  const firstItem = subscription.items?.data?.[0];

  return {
    currentPeriodStart: firstItem?.current_period_start
      ? new Date(firstItem.current_period_start * 1000)
      : undefined,
    currentPeriodEnd: firstItem?.current_period_end
      ? new Date(firstItem.current_period_end * 1000)
      : undefined,
  };
}

/**
 * Find or create Stripe product by external ID
 * Uses metadata for idempotency
 */
export async function findOrCreateProduct(params: {
  externalId: string;
  name: string;
  description?: string;
}): Promise<Stripe.Product> {
  // Search for existing product by metadata
  const existingProducts = await stripe.products.search({
    query: `metadata['externalId']:'${params.externalId}'`,
    limit: 1,
  });

  if (existingProducts.data.length > 0) {
    console.log(`   ⏭️  Stripe product "${params.name}" already exists`);
    return existingProducts.data[0];
  }

  // Create new product
  const product = await stripe.products.create({
    name: params.name,
    description: params.description,
    metadata: {
      externalId: params.externalId,
    },
  });

  console.log(`   ✅ Created Stripe product: ${params.name}`);
  return product;
}

/**
 * Find or create Stripe price for a product
 * Uses metadata for idempotency
 */
export async function findOrCreatePrice(params: {
  externalId: string;
  productId: string;
  unitAmount: number; // in cents
  currency?: string;
  interval: 'month' | 'year';
}): Promise<Stripe.Price> {
  // Search for existing price by metadata
  const existingPrices = await stripe.prices.search({
    query: `metadata['externalId']:'${params.externalId}'`,
    limit: 1,
  });

  if (existingPrices.data.length > 0) {
    console.log(`   ⏭️  Stripe price for "${params.externalId}" already exists`);
    return existingPrices.data[0];
  }

  // Create new price
  const price = await stripe.prices.create({
    product: params.productId,
    unit_amount: params.unitAmount,
    currency: params.currency || 'usd',
    recurring: {
      interval: params.interval,
    },
    metadata: {
      externalId: params.externalId,
    },
  });

  console.log(`   ✅ Created Stripe price: ${params.externalId} ($${params.unitAmount / 100}/${params.interval})`);
  return price;
}

/**
 * Create or update Stripe products and prices for a plan tier
 * Returns the Stripe Price IDs
 */
export async function syncPlanTierToStripe(
  planSlug: string,
  tierName: string,
  tierData: {
    monthlyPrice: number;
    yearlyPrice: number;
    description?: string;
  },
): Promise<{
  monthlyPriceId: string | null;
  yearlyPriceId: string | null;
}> {
  // Skip free tier (price is $0)
  if (tierData.monthlyPrice === 0 && tierData.yearlyPrice === 0) {
    console.log(`   ⏭️  Skipping Stripe sync for free tier: ${planSlug}-${tierName}`);
    return { monthlyPriceId: null, yearlyPriceId: null };
  }

  const productExternalId = `byteinbox-${planSlug}-${tierName.toLowerCase()}`;
  const productName = `ByteInbox ${planSlug.toUpperCase()} - ${tierName}`;

  // Create or find product
  const product = await findOrCreateProduct({
    externalId: productExternalId,
    name: productName,
    description: tierData.description,
  });

  // Create or find monthly price
  let monthlyPriceId: string | null = null;
  if (tierData.monthlyPrice > 0) {
    const monthlyPrice = await findOrCreatePrice({
      externalId: `${productExternalId}-monthly`,
      productId: product.id,
      unitAmount: Math.round(tierData.monthlyPrice * 100), // Convert to cents
      interval: 'month',
    });
    monthlyPriceId = monthlyPrice.id;
  }

  // Create or find yearly price
  let yearlyPriceId: string | null = null;
  if (tierData.yearlyPrice > 0) {
    const yearlyPrice = await findOrCreatePrice({
      externalId: `${productExternalId}-yearly`,
      productId: product.id,
      unitAmount: Math.round(tierData.yearlyPrice * 100), // Convert to cents
      interval: 'year',
    });
    yearlyPriceId = yearlyPrice.id;
  }

  return { monthlyPriceId, yearlyPriceId };
}
