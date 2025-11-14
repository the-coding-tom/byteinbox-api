import { Controller, Get, Post, Patch, Delete, Body, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { SubscriptionsService } from './subscriptions.service';
import {
  CreateCheckoutSessionDto,
  ChangePlanDto,
} from './dto/subscriptions.dto';

@Controller('api/v1/subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  /**
   * Get current subscription
   * GET /api/v1/subscriptions
   */
  @Get()
  async getSubscription(@Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.subscriptionsService.getSubscription(request.teamId);
    response.status(status).json(restOfResponse);
  }

  /**
   * Create checkout session for new subscription
   * POST /api/v1/subscriptions/checkout
   */
  @Post('checkout')
  async createCheckoutSession(
    @Req() request: any,
    @Body() dto: CreateCheckoutSessionDto,
    @Res() response: Response,
  ) {
    const { status, ...restOfResponse } = await this.subscriptionsService.createCheckoutSession(
      request.teamId,
      dto,
      request.user.email,
    );
    response.status(status).json(restOfResponse);
  }

  /**
   * Change subscription plan (upgrade or downgrade)
   * PATCH /api/v1/subscriptions/change-plan
   */
  @Patch('change-plan')
  async changePlan(
    @Req() request: any,
    @Body() dto: ChangePlanDto,
    @Res() response: Response,
  ) {
    const { status, ...restOfResponse } = await this.subscriptionsService.changePlan(request.teamId, dto);
    response.status(status).json(restOfResponse);
  }

  /**
   * Cancel subscription (turns off auto-renewal, subscription remains active until period end)
   * DELETE /api/v1/subscriptions/cancel
   */
  @Delete('cancel')
  async cancelSubscription(
    @Req() request: any,
    @Res() response: Response,
  ) {
    const { status, ...restOfResponse } = await this.subscriptionsService.cancelSubscription(request.teamId);
    response.status(status).json(restOfResponse);
  }

  /**
   * Get billing portal session
   * GET /api/v1/subscriptions/portal
   */
  @Get('portal')
  async getPortalSession(@Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.subscriptionsService.getPortalSession(request.teamId);
    response.status(status).json(restOfResponse);
  }

  /**
   * Get invoices
   * GET /api/v1/subscriptions/invoices
   */
  @Get('invoices')
  async getInvoices(@Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.subscriptionsService.getInvoices(request.teamId);
    response.status(status).json(restOfResponse);
  }
}
