import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { BroadcastsService } from './broadcasts.service';
import { CreateBroadcastDto, UpdateBroadcastDto, SendBroadcastDto, BroadcastFilterDto } from './dto/broadcasts.dto';

@Controller('api/v1/broadcasts')
export class BroadcastsController {
  constructor(private readonly broadcastsService: BroadcastsService) {}

  @Post()
  async createBroadcast(@Body() createBroadcastDto: CreateBroadcastDto, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.broadcastsService.createBroadcast(request.user.id, request.teamId, createBroadcastDto);
    response.status(status).json(restOfResponse);
  }

  @Get()
  async getBroadcasts(@Query() filter: BroadcastFilterDto, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.broadcastsService.getBroadcasts(request.teamId, filter);
    response.status(status).json(restOfResponse);
  }

  @Get(':id')
  async getBroadcastDetails(@Param('id') id: string, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.broadcastsService.getBroadcastDetails(id, request.teamId);
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
  async sendBroadcast(@Param('id') id: string, @Body() sendBroadcastDto: SendBroadcastDto, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.broadcastsService.sendBroadcast(id, sendBroadcastDto, request);
    response.status(status).json(restOfResponse);
  }
}
