import { Controller, Get, Param, Query, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { LogsService } from './logs.service';
import { GetLogsDto } from './dto/logs.dto';

@Controller('api/v1/logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  async getLogs(@Query() query: GetLogsDto, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.logsService.getLogs(query, request.teamId);
    response.status(status).json(restOfResponse);
  }

  @Get(':id')
  async getLogDetails(@Param('id') id: string, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.logsService.getLogDetails(id, request.teamId);
    response.status(status).json(restOfResponse);
  }
}
