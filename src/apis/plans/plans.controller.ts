import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { PlansService } from './plans.service';
import { GetPlansQueryDto } from './dto/plans.dto';

@Controller('api/v1/plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  /**
   * Get all plans with tiers (public endpoint - no auth required)
   * GET /api/v1/plans
   */
  @Get()
  async getAllPlans(
    @Query() query: GetPlansQueryDto,
    @Res() response: Response,
  ) {
    const { status, ...restOfResponse } =
      await this.plansService.getAllPlans(query);
    response.status(status).json(restOfResponse);
  }

  /**
   * Get plan by slug (public endpoint)
   * GET /api/v1/plans/:slug
   */
  @Get(':slug')
  async getPlanBySlug(@Param('slug') slug: string, @Res() response: Response) {
    const { status, ...restOfResponse } =
      await this.plansService.getPlanBySlug(slug);
    response.status(status).json(restOfResponse);
  }
}
