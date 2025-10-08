import { Controller, Get, Param, Query, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { LogsService } from './logs.service';
import { LogFilterDto } from './dto/logs.dto';

@Controller('api/v1/logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  async getLogs(@Query() filter: LogFilterDto, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.logsService.getLogs(request.user.id, filter);
    response.status(status).json(restOfResponse);
  }

  @Get(':id')
  async getLogDetails(@Param('id') id: string, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.logsService.getLogDetails(id, request.user.id);
    response.status(status).json(restOfResponse);
  }
}
