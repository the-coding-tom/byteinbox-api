import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { MetricsService } from './metrics.service';

@Controller('api/v1/metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  async getMetrics(
    @Req() request: any,
    @Res() response: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const { status, ...restOfResponse } = await this.metricsService.getMetrics(request.user.id, startDate, endDate);
    response.status(status).json(restOfResponse);
  }
}
