import { Injectable, HttpStatus } from '@nestjs/common';
import * as Joi from 'joi';
import { validateJoiSchema } from '../../utils/joi.validator';
import { throwError } from '../../utils/util';
import {
  CreateCheckoutSessionDto,
  ChangePlanDto,
} from './dto/subscriptions.dto';
import { SubscriptionRepository } from '../../repositories/subscription.repository';
import { PlanTierRepository } from '../../repositories/plan-tier.repository';

@Injectable()
export class SubscriptionsValidator {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly planTierRepository: PlanTierRepository,
  ) {}

  async validateCreateCheckoutSession(
    dto: CreateCheckoutSessionDto,
  ): Promise<CreateCheckoutSessionDto> {
    const schema = Joi.object({
      priceId: Joi.string().required().messages({
        'string.base': 'Price ID must be a string',
        'any.required': 'Price ID is required',
      }),
      successUrl: Joi.string().uri().optional(),
      cancelUrl: Joi.string().uri().optional(),
    });

    const error = validateJoiSchema(schema, dto);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    return dto;
  }

  async validateGetSubscription(
    teamId: number,
  ): Promise<any> {
    const subscription = await this.subscriptionRepository.findDetailedByTeamId(teamId);

    if (!subscription) {
      throwError('No active subscription found', HttpStatus.NOT_FOUND, 'subscriptionNotFound');
    }

    return subscription;
  }

  async validateChangePlan(
    dto: ChangePlanDto,
    teamId: number,
  ): Promise<{ validatedData: ChangePlanDto; subscription: any; currentTier: any; newTier: any; isUpgrade: boolean }> {
    const schema = Joi.object({
      newPriceId: Joi.string().required().messages({
        'string.base': 'New price ID must be a string',
        'any.required': 'New price ID is required',
      }),
    });

    const error = validateJoiSchema(schema, dto);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    // Get current subscription
    const subscription = await this.subscriptionRepository.findByTeamId(teamId);

    if (!subscription || !subscription.stripeSubscriptionId) {
      throwError('No active subscription found', HttpStatus.NOT_FOUND, 'subscriptionNotFound');
    }

    // Get current tier
    const currentTier = await this.planTierRepository.findById(subscription.planTierId);
    if (!currentTier) {
      throwError('Current plan tier not found', HttpStatus.NOT_FOUND, 'currentTierNotFound');
    }

    // Find new tier by Stripe price ID
    const newTier = await this.planTierRepository.findByStripePriceId(dto.newPriceId);
    if (!newTier) {
      throwError('New plan tier not found', HttpStatus.NOT_FOUND, 'newTierNotFound');
    }

    // Determine if this is an upgrade or downgrade using rank
    const isUpgrade = newTier.rank > currentTier.rank;

    return { validatedData: dto, subscription, currentTier, newTier, isUpgrade };
  }

  async validateGetPortalSession(
    teamId: number,
  ): Promise<any> {
    const subscription = await this.subscriptionRepository.findByTeamId(teamId);

    if (!subscription || !subscription.stripeCustomerId) {
      throwError('No Stripe customer found', HttpStatus.NOT_FOUND, 'customerNotFound');
    }

    return subscription;
  }

  async validateCancelSubscription(
    teamId: number,
  ): Promise<any> {
    const subscription = await this.subscriptionRepository.findByTeamId(teamId);

    if (!subscription || !subscription.stripeSubscriptionId) {
      throwError('No active subscription found', HttpStatus.NOT_FOUND, 'subscriptionNotFound');
    }

    if (subscription.cancelAtPeriodEnd) {
      throwError('Subscription is already set to cancel', HttpStatus.BAD_REQUEST, 'alreadyCancelled');
    }

    return subscription;
  }

  async validateGetInvoices(
    teamId: number,
  ): Promise<any> {
    const subscription = await this.subscriptionRepository.findByTeamId(teamId);

    if (!subscription || !subscription.stripeCustomerId) {
      throwError('No Stripe customer found', HttpStatus.NOT_FOUND, 'customerNotFound');
    }

    return subscription;
  }
}
