import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { MetricsService } from './metrics.service';
import { MetricsFilterDto } from './dto/metrics.dto';

@Controller('api/v1/metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  async getMetrics(
    @Req() request: any,
    @Res() response: Response,
    @Query() filter: MetricsFilterDto
  ) {
    const { status, ...restOfResponse } = await this.metricsService.getMetrics(request.teamId, filter);
    response.status(status).json(restOfResponse);
  }
}
