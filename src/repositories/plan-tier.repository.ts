import { Injectable } from '@nestjs/common';
import prisma from '../common/prisma';

@Injectable()
export class PlanTierRepository {
  /**
   * Find tier by ID
   */
  async findById(id: number): Promise<any> {
    return prisma.planTier.findUnique({
      where: { id },
      include: {
        Plan: true,
      },
    });
  }

  /**
   * Find tiers by plan ID
   */
  async findByPlanId(planId: number): Promise<any[]> {
    return prisma.planTier.findMany({
      where: {
        planId,
        isActive: true,
      },
      orderBy: { displayOrder: 'asc' },
    });
  }

  /**
   * Find tier by plan ID and email volume
   */
  async findByPlanAndVolume(planId: number, emailVolume: number): Promise<any> {
    return prisma.planTier.findFirst({
      where: {
        planId,
        isActive: true,
        minEmails: { lte: emailVolume },
        maxEmails: { gte: emailVolume },
      },
      include: {
        Plan: true,
      },
    });
  }

  /**
   * Find tier by Stripe price ID (monthly or yearly)
   */
  async findByStripePriceId(stripePriceId: string): Promise<any> {
    return prisma.planTier.findFirst({
      where: {
        OR: [
          { stripeMonthlyPriceId: stripePriceId },
          { stripeYearlyPriceId: stripePriceId },
        ],
        isActive: true,
      },
      include: {
        Plan: true,
      },
    });
  }
}
