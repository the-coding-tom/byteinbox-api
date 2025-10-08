import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { BroadcastsService } from './broadcasts.service';
import { CreateBroadcastDto, UpdateBroadcastDto, AutoSaveBroadcastDto, SendTestBroadcastDto, BroadcastFilterDto } from './dto/broadcasts.dto';

@Controller('api/v1/broadcasts')
export class BroadcastsController {
  constructor(private readonly broadcastsService: BroadcastsService) {}

  @Post()
  async createBroadcast(@Body() createBroadcastDto: CreateBroadcastDto, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.broadcastsService.createBroadcast(request.user.id, createBroadcastDto, request);
    response.status(status).json(restOfResponse);
  }

  @Get()
  async getBroadcasts(@Query() filter: BroadcastFilterDto, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.broadcastsService.getBroadcasts(request.user.id, filter);
    response.status(status).json(restOfResponse);
  }

  @Get(':id')
  async getBroadcastDetails(@Param('id') id: string, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.broadcastsService.getBroadcastDetails(id, request.user.id);
    response.status(status).json(restOfResponse);
  }

  @Put(':id')
  async updateBroadcast(@Param('id') id: string, @Body() updateBroadcastDto: UpdateBroadcastDto, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.broadcastsService.updateBroadcast(id, request.user.id, updateBroadcastDto, request);
    response.status(status).json(restOfResponse);
  }

  @Delete(':id')
  async deleteBroadcast(@Param('id') id: string, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.broadcastsService.deleteBroadcast(id, request.user.id, request);
    response.status(status).json(restOfResponse);
  }

  @Post(':id/send')
  async sendBroadcast(@Param('id') id: string, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.broadcastsService.sendBroadcast(id, request.user.id, request);
    response.status(status).json(restOfResponse);
  }

  @Get('stats/overview')
  async getBroadcastStats(@Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.broadcastsService.getBroadcastStats(request.user.id);
    response.status(status).json(restOfResponse);
  }

  @Post(':id/auto-save')
  async autoSaveBroadcast(
    @Param('id') id: string,
    @Body() autoSaveBroadcastDto: AutoSaveBroadcastDto,
    @Req() request: any,
    @Res() response: Response
  ) {
    const { status, ...restOfResponse } = await this.broadcastsService.autoSaveBroadcast(id, request.user.id, autoSaveBroadcastDto, request);
    response.status(status).json(restOfResponse);
  }

  @Post(':id/send-test')
  async sendTestBroadcast(
    @Param('id') id: string,
    @Body() sendTestBroadcastDto: SendTestBroadcastDto,
    @Req() request: any,
    @Res() response: Response
  ) {
    const { status, ...restOfResponse } = await this.broadcastsService.sendTestBroadcast(id, request.user.id, sendTestBroadcastDto, request);
    response.status(status).json(restOfResponse);
  }

  @Get('drafts')
  async getDraftBroadcasts(@Query() filter: BroadcastFilterDto, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.broadcastsService.getDraftBroadcasts(request.user.id, filter);
    response.status(status).json(restOfResponse);
  }
}
