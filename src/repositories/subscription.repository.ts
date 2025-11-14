import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import prisma from '../common/prisma';
import {
  CreateSubscriptionData,
  UpdateSubscriptionData,
} from './entities/subscription.entity';

@Injectable()
export class SubscriptionRepository {
  /**
   * Create new subscription
   */
  async create(data: CreateSubscriptionData): Promise<any> {
    return prisma.subscription.create({
      data,
      include: {
        Plan: {
          include: {
            tiers: true,
          },
        },
        PlanTier: true,
        Team: true,
      },
    });
  }

  /**
   * Find subscription by ID
   */
  async findById(id: number): Promise<any> {
    return prisma.subscription.findUnique({
      where: { id },
      include: {
        Plan: {
          include: {
            tiers: true,
          },
        },
        PlanTier: true,
        Team: true,
      },
    });
  }

  /**
   * Find active subscription by team ID
   */
  async findByTeamId(teamId: number): Promise<any> {
    return prisma.subscription.findFirst({
      where: {
        teamId,
        status: {
          in: ['ACTIVE', 'TRIALING', 'PAST_DUE'],
        },
      },
      include: {
        Plan: {
          include: {
            tiers: true,
          },
        },
        PlanTier: true,
        Team: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Find active subscription by team ID with formatted response
   */
  async findDetailedByTeamId(teamId: number): Promise<any | null> {
    const query = Prisma.sql`
      SELECT
        s.id,
        s.status,
        json_build_object(
          'id', p.id,
          'name', p.name,
          'displayName', p.display_name,
          'maxEmailsPerDay', p.max_emails_per_day
        ) AS plan,
        CASE
          WHEN s.plan_tier_id IS NOT NULL THEN
            json_build_object(
              'id', pt.id,
              'name', pt.name,
              'minEmails', pt.min_emails,
              'maxEmails', pt.max_emails
            )
          ELSE NULL
        END AS tier,
        json_build_object(
          'emailsSentThisMonth', s.emails_sent_this_month,
          'emailsSentToday', s.emails_sent_today,
          'maxEmailsPerMonth', COALESCE(pt.max_emails, (
            SELECT pt2.max_emails
            FROM plan_tiers pt2
            WHERE pt2.plan_id = p.id AND pt2.is_active = true
            ORDER BY pt2.display_order ASC
            LIMIT 1
          )),
          'maxEmailsPerDay', p.max_emails_per_day,
          'monthlyPercentageUsed', CASE
            WHEN COALESCE(pt.max_emails, (
              SELECT pt2.max_emails
              FROM plan_tiers pt2
              WHERE pt2.plan_id = p.id AND pt2.is_active = true
              ORDER BY pt2.display_order ASC
              LIMIT 1
            )) > 0 THEN
              (s.emails_sent_this_month::float / COALESCE(pt.max_emails, (
                SELECT pt2.max_emails
                FROM plan_tiers pt2
                WHERE pt2.plan_id = p.id AND pt2.is_active = true
                ORDER BY pt2.display_order ASC
                LIMIT 1
              ))::float) * 100
            ELSE 0
          END,
          'dailyPercentageUsed', CASE
            WHEN p.max_emails_per_day = 999999 THEN 0
            ELSE (s.emails_sent_today::float / p.max_emails_per_day::float) * 100
          END
        ) AS usage,
        json_build_object(
          'interval', s.billing_interval,
          'currentPeriodStart', s.current_period_start::text,
          'currentPeriodEnd', s.current_period_end::text,
          'cancelAtPeriodEnd', s.cancel_at_period_end,
          'canceledAt', s.canceled_at::text
        ) AS billing,
        CASE WHEN p.name != 'enterprise' THEN true ELSE false END AS "canUpgrade",
        CASE WHEN p.name != 'free' THEN true ELSE false END AS "canDowngrade"
      FROM subscriptions s
      INNER JOIN plans p ON s.plan_id = p.id
      LEFT JOIN plan_tiers pt ON s.plan_tier_id = pt.id
      WHERE s.team_id = ${teamId}
        AND s.status IN ('ACTIVE', 'TRIALING', 'PAST_DUE')
      ORDER BY s.created_at DESC
      LIMIT 1
    `;

    const [subscription] = await prisma.$queryRaw<any[]>(query);
    return subscription;
  }

  /**
   * Find subscription by Stripe subscription ID
   */
  async findByStripeSubscriptionId(stripeSubscriptionId: string): Promise<any> {
    return prisma.subscription.findUnique({
      where: { stripeSubscriptionId },
      include: {
        Plan: {
          include: {
            tiers: true,
          },
        },
        PlanTier: true,
        Team: true,
      },
    });
  }

  /**
   * Update subscription
   */
  async update(id: number, data: UpdateSubscriptionData): Promise<any> {
    return prisma.subscription.update({
      where: { id },
      data,
      include: {
        Plan: {
          include: {
            tiers: true,
          },
        },
        PlanTier: true,
        Team: true,
      },
    });
  }

  /**
   * Increment email sent count (monthly)
   */
  async incrementEmailCount(id: number, count: number = 1): Promise<any> {
    return prisma.subscription.update({
      where: { id },
      data: {
        emailsSentThisMonth: {
          increment: count,
        },
      },
    });
  }

  /**
   * Increment daily email count
   */
  async incrementDailyEmailCount(id: number, count: number = 1): Promise<any> {
    return prisma.subscription.update({
      where: { id },
      data: {
        emailsSentToday: {
          increment: count,
        },
      },
    });
  }

  /**
   * Reset monthly usage for subscription
   */
  async resetMonthlyUsage(id: number): Promise<any> {
    return prisma.subscription.update({
      where: { id },
      data: {
        emailsSentThisMonth: 0,
        lastUsageReset: new Date(),
      },
    });
  }

  /**
   * Reset daily usage for subscription
   */
  async resetDailyUsage(id: number): Promise<any> {
    return prisma.subscription.update({
      where: { id },
      data: {
        emailsSentToday: 0,
        lastDailyReset: new Date(),
      },
    });
  }

  /**
   * Reset monthly usage for all active subscriptions
   */
  async resetAllMonthlyUsage(): Promise<any> {
    return prisma.subscription.updateMany({
      where: {
        status: {
          in: ['ACTIVE', 'TRIALING'],
        },
      },
      data: {
        emailsSentThisMonth: 0,
        lastUsageReset: new Date(),
      },
    });
  }

  /**
   * Reset daily usage for all active subscriptions
   */
  async resetAllDailyUsage(): Promise<any> {
    return prisma.subscription.updateMany({
      where: {
        status: {
          in: ['ACTIVE', 'TRIALING'],
        },
      },
      data: {
        emailsSentToday: 0,
        lastDailyReset: new Date(),
      },
    });
  }

  /**
   * Cancel subscription
   */
  async cancel(id: number, cancelAtPeriodEnd: boolean = true): Promise<any> {
    return prisma.subscription.update({
      where: { id },
      data: {
        cancelAtPeriodEnd,
        canceledAt: cancelAtPeriodEnd ? null : new Date(),
        status: cancelAtPeriodEnd ? 'ACTIVE' : 'CANCELED',
      },
    });
  }

  /**
   * Resume cancelled subscription
   */
  async resume(id: number): Promise<any> {
    return prisma.subscription.update({
      where: { id },
      data: {
        cancelAtPeriodEnd: false,
        canceledAt: null,
        status: 'ACTIVE',
      },
    });
  }

  /**
   * Find subscriptions that need daily reset
   */
  async findSubscriptionsNeedingDailyReset(): Promise<any[]> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    return prisma.subscription.findMany({
      where: {
        status: {
          in: ['ACTIVE', 'TRIALING'],
        },
        lastDailyReset: {
          lt: oneDayAgo,
        },
      },
    });
  }

  /**
   * Find subscriptions that need monthly reset
   */
  async findSubscriptionsNeedingMonthlyReset(): Promise<any[]> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    return prisma.subscription.findMany({
      where: {
        status: {
          in: ['ACTIVE', 'TRIALING'],
        },
        lastUsageReset: {
          lt: thirtyDaysAgo,
        },
      },
    });
  }
}
