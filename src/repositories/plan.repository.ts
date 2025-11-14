import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import prisma from '../common/prisma';
import { PlanListFilters } from './entities/plan.entity';

@Injectable()
export class PlanRepository {
  /**
   * Return all active plans with tiers formatted for API responses.
   */
  async findAllDetailed(filters: PlanListFilters): Promise<any[]> {
    const { planType, name } = filters;

    const whereClause = Prisma.sql`
      WHERE p.is_active = true
      AND (
        p.plan_type = ${planType}::plan_type
        OR COALESCE(${planType}, NULL) IS NULL
      )
      AND (
        p.name ILIKE CONCAT('%', ${name ?? ''}::text, '%')
        OR p.display_name ILIKE CONCAT('%', ${name ?? ''}::text, '%')
        OR COALESCE(${name}, NULL) IS NULL
      )
    `;

    const query = Prisma.sql`
      SELECT
        p.id,
        p.name,
        p.slug,
        p.display_name AS "displayName",
        p.description,
        p.display_order AS "displayOrder",
        p.is_contact_sales AS "isContactSales",
        json_build_object(
          'customDomain', p.custom_domain,
          'advancedAnalytics', p.advanced_analytics,
          'prioritySupport', p.priority_support,
          'apiAccess', p.api_access,
          'webhookSupport', p.webhook_support,
          'teamCollaboration', p.team_collaboration
        ) AS features,
        json_build_object(
          'maxDomains', p.max_domains,
          'maxEmailsPerDay', p.max_emails_per_day,
          'maxTeamMembers', p.max_team_members,
          'maxTemplates', p.max_templates,
          'maxWebhooks', p.max_webhooks,
          'maxContacts', p.max_contacts,
          'maxAudiences', p.max_audiences,
          'maxBroadcasts', p.max_broadcasts
        ) AS limits,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', pt.id,
                'name', pt.name,
                'minEmails', pt.min_emails,
                'maxEmails', pt.max_emails,
                'monthlyPrice', pt.monthly_price::text,
                'yearlyPrice', pt.yearly_price::text,
                'displayOrder', pt.display_order
              )
              ORDER BY pt.display_order ASC
            )
            FROM plan_tiers pt
            WHERE pt.plan_id = p.id AND pt.is_active = true
          ),
          '[]'::json
        ) AS tiers
      FROM plans p
      ${whereClause}
      ORDER BY p.display_order ASC
    `;

    return prisma.$queryRaw<any[]>(query);
  }

  /**
   * Find a single plan by slug, including tier details, formatted for API responses.
   */
  async findDetailedBySlug(slug: string): Promise<any | null> {
    const query = Prisma.sql`
      SELECT
        p.id,
        p.name,
        p.slug,
        p.display_name AS "displayName",
        p.description,
        p.display_order AS "displayOrder",
        p.is_contact_sales AS "isContactSales",
        json_build_object(
          'customDomain', p.custom_domain,
          'advancedAnalytics', p.advanced_analytics,
          'prioritySupport', p.priority_support,
          'apiAccess', p.api_access,
          'webhookSupport', p.webhook_support,
          'teamCollaboration', p.team_collaboration
        ) AS features,
        json_build_object(
          'maxDomains', p.max_domains,
          'maxEmailsPerDay', p.max_emails_per_day,
          'maxTeamMembers', p.max_team_members,
          'maxTemplates', p.max_templates,
          'maxWebhooks', p.max_webhooks,
          'maxContacts', p.max_contacts,
          'maxAudiences', p.max_audiences,
          'maxBroadcasts', p.max_broadcasts
        ) AS limits,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', pt.id,
                'name', pt.name,
                'minEmails', pt.min_emails,
                'maxEmails', pt.max_emails,
                'monthlyPrice', pt.monthly_price::text,
                'yearlyPrice', pt.yearly_price::text,
                'displayOrder', pt.display_order
              )
              ORDER BY pt.display_order ASC
            )
            FROM plan_tiers pt
            WHERE pt.plan_id = p.id AND pt.is_active = true
          ),
          '[]'::json
        ) AS tiers
      FROM plans p
      WHERE p.slug = ${slug} AND p.is_active = true
      LIMIT 1
    `;

    const [plan] = await prisma.$queryRaw<any[]>(query);
    return plan;
  }
}

