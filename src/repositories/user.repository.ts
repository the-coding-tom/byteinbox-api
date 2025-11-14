import { Injectable } from '@nestjs/common';
import { PlanType, Prisma, SubscriptionStatus, BillingInterval } from '@prisma/client';
import prisma from '../common/prisma';
import { FindUsersWithPaginationFilter } from './entities/user.entity';
import { TeamMemberRole } from '../common/enums/generic.enum';

@Injectable()
export class UserRepository {
  async createLocalAuthUserAndPersonalTeam(userData: any): Promise<any> {
    return prisma.$transaction(async (prismaClient) => {
      // Extract team data, verification data, and default plan info from userData (passed by service)
      const {
        teamName,
        teamSlug,
        password,
        emailVerificationToken,
        emailVerificationExpiresAt,
        defaultTransactionalPlanSlug,
        defaultTransactionalTierName,
        defaultMarketingPlanSlug,
        defaultMarketingTierName,
        subscriptionStartDate,
        subscriptionEndDate,
        ...userFields
      } = userData;

      const user = await prismaClient.user.create({
        data: {
          email: userFields.email,
          name: userFields.name,
          firstName: userFields.firstName,
          lastName: userFields.lastName,
          photoUrl: userFields.photoUrl,
          timezone: userFields.timezone || 'UTC',
          language: userFields.language || 'en',
          status: userFields.status || 'ACTIVE',
          type: userFields.type || 'CUSTOMER',
          emailVerifiedAt: userFields.emailVerifiedAt,
          totpEnabled: userFields.totpEnabled || false,
          totpSecret: userFields.totpSecret,
          localAuthAccount: {
            create: {
              passwordHash: password, // Already hashed by service
            },
          },
          teamMemberships: {
            create: {
              role: TeamMemberRole.owner,
              Team: {
                create: {
                  name: teamName,
                  slug: teamSlug,
                },
              },
            },
          },
          verificationRequests: {
            create: {
              email: userFields.email,
              token: emailVerificationToken,
              type: 'EMAIL_VERIFICATION',
              expiresAt: emailVerificationExpiresAt,
            },
          },
        },
      });

      // Get the created team ID
      const teamMembership = await prismaClient.teamMember.findFirstOrThrow({
        where: { userId: user.id, role: TeamMemberRole.owner },
        select: { teamId: true },
      });

      const teamId = teamMembership.teamId;

      // Fetch transactional email free plan and tier
      const transactionalPlan = await prismaClient.plan.findFirstOrThrow({
        where: {
          slug: defaultTransactionalPlanSlug,
          planType: PlanType.TRANSACTIONAL,
        },
        select: { id: true },
      });

      const transactionalTier = await prismaClient.planTier.findFirstOrThrow({
        where: {
          planId: transactionalPlan.id,
          name: defaultTransactionalTierName,
          isActive: true,
        },
        select: { id: true },
      });

      await prismaClient.subscription.create({
        data: {
          teamId,
          planId: transactionalPlan.id,
          planTierId: transactionalTier.id,
          status: SubscriptionStatus.ACTIVE,
          billingInterval: BillingInterval.MONTHLY,
          currentPeriodStart: subscriptionStartDate,
          currentPeriodEnd: subscriptionEndDate,
          cancelAtPeriodEnd: false,
        },
      });

      // Fetch marketing email free plan and tier
      const marketingPlan = await prismaClient.plan.findFirstOrThrow({
        where: {
          slug: defaultMarketingPlanSlug,
          planType: PlanType.MARKETING,
        },
        select: { id: true },
      });

      const marketingTier = await prismaClient.planTier.findFirstOrThrow({
        where: {
          planId: marketingPlan.id,
          name: defaultMarketingTierName,
          isActive: true,
        },
        select: { id: true },
      });

      await prismaClient.subscription.create({
        data: {
          teamId,
          planId: marketingPlan.id,
          planTierId: marketingTier.id,
          status: SubscriptionStatus.ACTIVE,
          billingInterval: BillingInterval.MONTHLY,
          currentPeriodStart: subscriptionStartDate,
          currentPeriodEnd: subscriptionEndDate,
          cancelAtPeriodEnd: false,
        },
      });

      return user;
    });
  }

  async createOAuthUserAndPersonalTeam(userData: any): Promise<any> {
    return prisma.$transaction(async (prismaClient) => {
      // Extract team data and default plan info from userData (passed by service)
      const {
        teamName,
        teamSlug,
        defaultTransactionalPlanSlug,
        defaultTransactionalTierName,
        defaultMarketingPlanSlug,
        defaultMarketingTierName,
        subscriptionStartDate,
        subscriptionEndDate,
        ...userFields
      } = userData;

      const user = await prismaClient.user.create({
        data: {
          email: userFields.email,
          name: userFields.name,
          firstName: userFields.firstName,
          lastName: userFields.lastName,
          photoUrl: userFields.photoUrl,
          timezone: userFields.timezone || 'UTC',
          language: userFields.language || 'en',
          status: userFields.status || 'ACTIVE',
          type: userFields.type || 'CUSTOMER',
          emailVerifiedAt: userFields.emailVerifiedAt,
          totpEnabled: userFields.totpEnabled || false,
          totpSecret: userFields.totpSecret,
          teamMemberships: {
            create: {
              role: TeamMemberRole.owner,
              Team: {
                create: {
                  name: teamName,
                  slug: teamSlug,
                },
              },
            },
          },
        },
      });

      // Get the created team ID
      const teamMembership = await prismaClient.teamMember.findFirstOrThrow({
        where: { userId: user.id, role: TeamMemberRole.owner },
        select: { teamId: true },
      });

      const teamId = teamMembership.teamId;

      // Fetch transactional email free plan and tier
      const transactionalPlan = await prismaClient.plan.findFirstOrThrow({
        where: {
          slug: defaultTransactionalPlanSlug,
          planType: PlanType.TRANSACTIONAL,
        },
        select: { id: true },
      });

      const transactionalTier = await prismaClient.planTier.findFirstOrThrow({
        where: {
          planId: transactionalPlan.id,
          name: defaultTransactionalTierName,
          isActive: true,
        },
        select: { id: true },
      });

      // Subscribe to transactional email free plan and tier
      await prismaClient.subscription.create({
        data: {
          teamId,
          planId: transactionalPlan.id,
          planTierId: transactionalTier.id,
          status: SubscriptionStatus.ACTIVE,
          billingInterval: BillingInterval.MONTHLY,
          currentPeriodStart: subscriptionStartDate,
          currentPeriodEnd: subscriptionEndDate,
          cancelAtPeriodEnd: false,
        },
      });

      // Fetch marketing email free plan and tier
      const marketingPlan = await prismaClient.plan.findFirstOrThrow({
        where: {
          slug: defaultMarketingPlanSlug,
          planType: PlanType.MARKETING,
        },
        select: { id: true },
      });

      const marketingTier = await prismaClient.planTier.findFirstOrThrow({
        where: {
          planId: marketingPlan.id,
          name: defaultMarketingTierName,
          isActive: true,
        },
        select: { id: true },
      });

      // Subscribe to marketing email free plan and tier
      await prismaClient.subscription.create({
        data: {
          teamId,
          planId: marketingPlan.id,
          planTierId: marketingTier.id,
          status: SubscriptionStatus.ACTIVE,
          billingInterval: BillingInterval.MONTHLY,
          currentPeriodStart: subscriptionStartDate,
          currentPeriodEnd: subscriptionEndDate,
          cancelAtPeriodEnd: false,
        },
      });

      return user;
    });
  }

  async findById(id: number): Promise<any | null> {
    return prisma.user.findUnique({
      where: { id },
      include: {
        localAuthAccount: true,
      },
    });
  }

  async findByEmail(email: string): Promise<any | null> {
    return prisma.user.findUnique({
      where: { email },
      include: {
        localAuthAccount: true,
      },
    });
  }

  async update(id: number, data: Partial<any>): Promise<any> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async delete(id: number): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  }

  async findWithPagination(filter: FindUsersWithPaginationFilter): Promise<{ data: any[]; total: number; offset: number; limit: number }> {
    const { offset, limit } = filter;

    const whereClause = Prisma.sql`
      WHERE (
        U.email::text ILIKE CONCAT('%', ${filter.keyword}::text, '%') 
        OR U.first_name::text ILIKE CONCAT('%', ${filter.keyword}::text, '%')
        OR U.last_name::text ILIKE CONCAT('%', ${filter.keyword}::text, '%')
        OR COALESCE(${filter.keyword}, NULL) IS NULL
      )
      AND (
        CASE 
          WHEN ${filter.status} = 'active' THEN U.status = 'ACTIVE'
          WHEN ${filter.status} = 'inactive' THEN U.status = 'SUSPENDED'
          WHEN ${filter.status} = 'pending' THEN U.status = 'PENDING'
          WHEN ${filter.status} = 'suspended' THEN U.status = 'SUSPENDED'
          ELSE TRUE
        END
      )
    `;

    const query = Prisma.sql`
      SELECT 
        U.id,
        U.email,
        U.first_name,
        U.last_name,
        U.status,
        U.created_at,
        U.updated_at
      FROM users U 
      ${whereClause} 
      ORDER BY U.created_at DESC 
      LIMIT ${limit} 
      OFFSET ${offset}
    `;

    const countQuery = Prisma.sql`
      SELECT COUNT(*)::int 
      FROM users U 
      ${whereClause}
    `;

    const data: any[] = await prisma.$queryRaw(query);
    const [{ count }]: { count: number }[] = await prisma.$queryRaw(countQuery);

    return {
      data,
      total: count,
      offset,
      limit,
    };
  }

}
