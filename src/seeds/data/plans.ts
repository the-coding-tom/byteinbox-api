import { PrismaClient, PlanType } from '@prisma/client';
import { syncPlanTierToStripe } from '../../helpers/stripe.helper';

// Plan seed data with volume-based tiers
export const plansData = [
  // ============================================
  // TRANSACTIONAL PLANS
  // ============================================

  // Transactional Free Plan
  {
    name: 'transactional-free',
    slug: 'free',
    displayName: 'Transactional Free',
    description: 'Perfect for testing and small transactional email needs',
    planType: PlanType.TRANSACTIONAL,
    displayOrder: 1,
    isFree: true,
    isContactSales: false,

    // Features
    customDomain: false,
    advancedAnalytics: false,
    prioritySupport: false,
    apiAccess: true,
    webhookSupport: false,
    teamCollaboration: false,

    // Limits
    maxDomains: 1,
    maxEmailsPerDay: 100, // 100 emails per day for free plan
    maxTeamMembers: 1,
    maxTemplates: 5,
    maxWebhooks: 0,
    maxContacts: 500,
    maxAudiences: 0, // No marketing features
    maxBroadcasts: 0,

    tiers: [
      {
        name: '3K',
        minEmails: 0,
        maxEmails: 3000,
        monthlyPrice: 0,
        yearlyPrice: 0,
        displayOrder: 1,
      },
    ],
  },

  // Transactional Pro Plan
  {
    name: 'transactional-pro',
    slug: 'pro',
    displayName: 'Transactional Pro',
    description: 'Best for growing businesses with transactional email needs',
    planType: PlanType.TRANSACTIONAL,
    displayOrder: 2,
    isContactSales: false,

    // Features
    customDomain: true,
    advancedAnalytics: true,
    prioritySupport: false,
    apiAccess: true,
    webhookSupport: true,
    teamCollaboration: true,

    // Limits
    maxDomains: 5,
    maxEmailsPerDay: 999999, // Unlimited daily for paid plans
    maxTeamMembers: 5,
    maxTemplates: 50,
    maxWebhooks: 10,
    maxContacts: 10000,
    maxAudiences: 0, // No marketing features
    maxBroadcasts: 0,

    tiers: [
      {
        name: '50K',
        minEmails: 3001,
        maxEmails: 50000,
        monthlyPrice: 20,
        yearlyPrice: 200,
        displayOrder: 1,
      },
      {
        name: '100K',
        minEmails: 50001,
        maxEmails: 100000,
        monthlyPrice: 35,
        yearlyPrice: 350,
        displayOrder: 2,
      },
    ],
  },

  // Transactional Scale Plan
  {
    name: 'transactional-scale',
    slug: 'scale',
    displayName: 'Transactional Scale',
    description: 'For high-volume transactional email senders',
    planType: PlanType.TRANSACTIONAL,
    displayOrder: 3,
    isContactSales: false,

    // Features
    customDomain: true,
    advancedAnalytics: true,
    prioritySupport: true,
    apiAccess: true,
    webhookSupport: true,
    teamCollaboration: true,

    // Limits
    maxDomains: 20,
    maxEmailsPerDay: 999999, // Unlimited daily
    maxTeamMembers: 20,
    maxTemplates: 200,
    maxWebhooks: 50,
    maxContacts: 100000,
    maxAudiences: 0, // No marketing features
    maxBroadcasts: 0,

    tiers: [
      {
        name: '100K',
        minEmails: 100001,
        maxEmails: 100000,
        monthlyPrice: 90,
        yearlyPrice: 900,
        displayOrder: 1,
      },
      {
        name: '200K',
        minEmails: 100001,
        maxEmails: 200000,
        monthlyPrice: 160,
        yearlyPrice: 1600,
        displayOrder: 2,
      },
      {
        name: '500K',
        minEmails: 200001,
        maxEmails: 500000,
        monthlyPrice: 350,
        yearlyPrice: 3500,
        displayOrder: 3,
      },
      {
        name: '1M',
        minEmails: 500001,
        maxEmails: 1000000,
        monthlyPrice: 650,
        yearlyPrice: 6500,
        displayOrder: 4,
      },
      {
        name: '1.5M',
        minEmails: 1000001,
        maxEmails: 1500000,
        monthlyPrice: 825,
        yearlyPrice: 8250,
        displayOrder: 5,
      },
      {
        name: '2.5M',
        minEmails: 1500001,
        maxEmails: 2500000,
        monthlyPrice: 1050,
        yearlyPrice: 10500,
        displayOrder: 6,
      },
    ],
  },

  // Transactional Enterprise Plan
  {
    name: 'transactional-enterprise',
    slug: 'enterprise',
    displayName: 'Transactional Enterprise',
    description: 'Custom solutions for large organizations',
    planType: PlanType.TRANSACTIONAL,
    displayOrder: 4,
    isContactSales: true, // "Contact Sales" button

    // Features (all enabled)
    customDomain: true,
    advancedAnalytics: true,
    prioritySupport: true,
    apiAccess: true,
    webhookSupport: true,
    teamCollaboration: true,

    // Limits (unlimited or very high)
    maxDomains: 999,
    maxEmailsPerDay: 999999, // Unlimited daily
    maxTeamMembers: 999,
    maxTemplates: 999,
    maxWebhooks: 999,
    maxContacts: 999999999,
    maxAudiences: 0,
    maxBroadcasts: 0,

    tiers: [
      {
        name: '3M+',
        minEmails: 3000000,
        maxEmails: 999999999, // Effectively unlimited
        monthlyPrice: 0, // Custom pricing - not shown
        yearlyPrice: 0,
        displayOrder: 1,
      },
    ],
  },

  // ============================================
  // MARKETING PLANS
  // ============================================

  // Marketing Free Plan
  {
    name: 'marketing-free',
    slug: 'free',
    displayName: 'Marketing Free',
    description: 'Get started with email marketing campaigns',
    planType: PlanType.MARKETING,
    displayOrder: 5,
    isFree: true,
    isContactSales: false,

    // Features
    customDomain: false,
    advancedAnalytics: false,
    prioritySupport: false,
    apiAccess: false,
    webhookSupport: false,
    teamCollaboration: false,

    // Limits
    maxDomains: 1,
    maxEmailsPerDay: 999999, // No daily limit for marketing (controlled by contacts)
    maxTeamMembers: 1,
    maxTemplates: 5,
    maxWebhooks: 0,
    maxContacts: 1000, // 1,000 contacts for free
    maxAudiences: 3,
    maxBroadcasts: 10,

    tiers: [
      {
        name: '1K Contacts',
        minEmails: 0,
        maxEmails: 1000, // Using maxEmails for contacts count
        monthlyPrice: 0,
        yearlyPrice: 0,
        displayOrder: 1,
      },
    ],
  },

  // Marketing Pro Plan
  {
    name: 'marketing-pro',
    slug: 'pro',
    displayName: 'Marketing Pro',
    description: 'Grow your audience with advanced marketing features',
    planType: PlanType.MARKETING,
    displayOrder: 6,
    isContactSales: false,

    // Features
    customDomain: true,
    advancedAnalytics: true,
    prioritySupport: false,
    apiAccess: true,
    webhookSupport: false,
    teamCollaboration: true,

    // Limits
    maxDomains: 5,
    maxEmailsPerDay: 999999, // No daily limit for marketing
    maxTeamMembers: 5,
    maxTemplates: 100,
    maxWebhooks: 5,
    maxContacts: 150000, // Max 150K contacts in highest tier
    maxAudiences: 20,
    maxBroadcasts: 100,

    tiers: [
      {
        name: '5K Contacts',
        minEmails: 1001,
        maxEmails: 5000,
        monthlyPrice: 40,
        yearlyPrice: 400,
        displayOrder: 1,
      },
      {
        name: '10K Contacts',
        minEmails: 5001,
        maxEmails: 10000,
        monthlyPrice: 80,
        yearlyPrice: 800,
        displayOrder: 2,
      },
      {
        name: '25K Contacts',
        minEmails: 10001,
        maxEmails: 25000,
        monthlyPrice: 180,
        yearlyPrice: 1800,
        displayOrder: 3,
      },
      {
        name: '50K Contacts',
        minEmails: 25001,
        maxEmails: 50000,
        monthlyPrice: 250,
        yearlyPrice: 2500,
        displayOrder: 4,
      },
      {
        name: '100K Contacts',
        minEmails: 50001,
        maxEmails: 100000,
        monthlyPrice: 450,
        yearlyPrice: 4500,
        displayOrder: 5,
      },
      {
        name: '150K Contacts',
        minEmails: 100001,
        maxEmails: 150000,
        monthlyPrice: 650,
        yearlyPrice: 6500,
        displayOrder: 6,
      },
    ],
  },

  // Marketing Custom Plan
  {
    name: 'marketing-custom',
    slug: 'custom',
    displayName: 'Marketing Custom',
    description: 'Enterprise-grade marketing for unlimited audiences',
    planType: PlanType.MARKETING,
    displayOrder: 7,
    isContactSales: true, // "Contact Sales" button

    // Features (all enabled)
    customDomain: true,
    advancedAnalytics: true,
    prioritySupport: true,
    apiAccess: true,
    webhookSupport: true,
    teamCollaboration: true,

    // Limits (unlimited)
    maxDomains: 999,
    maxEmailsPerDay: 999999,
    maxTeamMembers: 999,
    maxTemplates: 999,
    maxWebhooks: 999,
    maxContacts: 999999999, // Unlimited contacts
    maxAudiences: 999,
    maxBroadcasts: 999,

    tiers: [
      {
        name: '200K+ Contacts',
        minEmails: 200000,
        maxEmails: 999999999, // Unlimited
        monthlyPrice: 0, // Custom pricing
        yearlyPrice: 0,
        displayOrder: 1,
      },
    ],
  },
];

/**
 * Seed plans and plan tiers
 * Automatically creates Stripe products and prices
 */
export async function seedPlans(prisma: PrismaClient) {
  console.log('🌱 Seeding plans and tiers...');

  for (const planData of plansData) {
    const { tiers: tiersList, ...planInfo } = planData;

    // Check if plan already exists
    let plan = await prisma.plan.findFirst({
      where: {
        slug: planInfo.slug,
        planType: planInfo.planType,
      },
    });

    if (plan) {
      console.log(`   ⏭️  Plan "${planInfo.displayName}" already exists in database`);
      
      // Check if tiers exist, create only if missing
      for (const tierData of tiersList) {
        const existingTier = await prisma.planTier.findUnique({
          where: {
            planId_minEmails: {
              planId: plan.id,
              minEmails: tierData.minEmails,
            },
          },
        });

        if (!existingTier) {
          await prisma.planTier.create({
            data: {
              planId: plan.id,
              name: tierData.name,
              minEmails: tierData.minEmails,
              maxEmails: tierData.maxEmails,
              monthlyPrice: tierData.monthlyPrice,
              yearlyPrice: tierData.yearlyPrice,
              monthlyPriceInCents: Math.round(Number(tierData.monthlyPrice) * 100),
              yearlyPriceInCents: Math.round(Number(tierData.yearlyPrice) * 100),
              rank: tierData.displayOrder,
              displayOrder: tierData.displayOrder,
            },
          });
          console.log(`   ✅ Created tier: ${tierData.name}`);
        }
      }
    } else {
      // Create plan first (without tiers inline)
      plan = await prisma.plan.create({
        data: {
          name: planInfo.name,
          slug: planInfo.slug,
          displayName: planInfo.displayName,
          description: planInfo.description,
          planType: planInfo.planType,
          customDomain: planInfo.customDomain,
          advancedAnalytics: planInfo.advancedAnalytics,
          prioritySupport: planInfo.prioritySupport,
          apiAccess: planInfo.apiAccess,
          webhookSupport: planInfo.webhookSupport,
          teamCollaboration: planInfo.teamCollaboration,
          maxDomains: planInfo.maxDomains,
          maxEmailsPerDay: planInfo.maxEmailsPerDay,
          maxTeamMembers: planInfo.maxTeamMembers,
          maxTemplates: planInfo.maxTemplates,
          maxWebhooks: planInfo.maxWebhooks,
          maxContacts: planInfo.maxContacts,
          maxAudiences: planInfo.maxAudiences,
          maxBroadcasts: planInfo.maxBroadcasts,
          isFree: planInfo.isFree || false,
          isContactSales: planInfo.isContactSales,
          displayOrder: planInfo.displayOrder,
        },
      });
      console.log(`   ✅ Created plan: ${plan.displayName}`);

      // Create tiers for the plan
      for (const tierData of tiersList) {
        await prisma.planTier.create({
          data: {
            planId: plan.id,
            name: tierData.name,
            minEmails: tierData.minEmails,
            maxEmails: tierData.maxEmails,
            monthlyPrice: tierData.monthlyPrice,
            yearlyPrice: tierData.yearlyPrice,
            monthlyPriceInCents: Math.round(Number(tierData.monthlyPrice) * 100),
            yearlyPriceInCents: Math.round(Number(tierData.yearlyPrice) * 100),
            rank: tierData.displayOrder, // Use displayOrder as rank
            displayOrder: tierData.displayOrder,
          },
        });
      }
      console.log(`   ✅ Created ${tiersList.length} tier(s) for ${plan.displayName}`);
    }

    // Fetch all tiers for this plan (in correct order)
    const planTiers = await prisma.planTier.findMany({
      where: { planId: plan.id },
      orderBy: { displayOrder: 'asc' },
    });

    // Sync each tier with Stripe (idempotent - safe to run multiple times)
    console.log(`   🔄 Syncing "${plan.displayName}" tiers with Stripe...`);

    for (let i = 0; i < planTiers.length; i++) {
      const tier = planTiers[i];
      const tierData = tiersList[i];

      try {
        // Create/find Stripe products and prices
        const { monthlyPriceId, yearlyPriceId } = await syncPlanTierToStripe(
          `${plan.planType.toLowerCase()}-${plan.slug}`,
          tier.name,
          {
            monthlyPrice: Number(tierData.monthlyPrice),
            yearlyPrice: Number(tierData.yearlyPrice),
            description: `${plan.displayName} - ${tier.name}`,
          },
        );

        // Update tier with Stripe Price IDs if they were created
        if (monthlyPriceId || yearlyPriceId) {
          await prisma.planTier.update({
            where: { id: tier.id },
            data: {
              stripeMonthlyPriceId: monthlyPriceId,
              stripeYearlyPriceId: yearlyPriceId,
            },
          });
          console.log(`   ✅ Updated tier "${tier.name}" with Stripe Price IDs`);
        }
      } catch (error: any) {
        console.error(`   ❌ Error syncing tier "${tier.name}" with Stripe:`, error.message);
        console.log('   ⚠️  Continuing with next tier...');
      }
    }
  }

  console.log('✅ Plans and Stripe sync completed successfully\n');
}
