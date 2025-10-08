import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { WebhooksService } from './webhooks.service';
import { CreateWebhookDto, UpdateWebhookDto, ToggleWebhookStatusDto, WebhookFilterDto } from './dto/webhooks.dto';

@Controller('api/v1/webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post()
  async createWebhook(@Body() createWebhookDto: CreateWebhookDto, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.webhooksService.createWebhook(request.user.id, createWebhookDto, request);
    response.status(status).json(restOfResponse);
  }

  @Get()
  async getWebhooks(@Query() filter: WebhookFilterDto, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.webhooksService.getWebhooks(request.user.id, filter);
    response.status(status).json(restOfResponse);
  }

  @Get(':id')
  async getWebhookDetails(@Param('id') id: string, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.webhooksService.getWebhookDetails(id, request.user.id);
    response.status(status).json(restOfResponse);
  }

  @Put(':id')
  async updateWebhook(@Param('id') id: string, @Body() updateWebhookDto: UpdateWebhookDto, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.webhooksService.updateWebhook(id, request.user.id, updateWebhookDto, request);
    response.status(status).json(restOfResponse);
  }

  @Delete(':id')
  async deleteWebhook(@Param('id') id: string, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.webhooksService.deleteWebhook(id, request.user.id, request);
    response.status(status).json(restOfResponse);
  }

  @Post(':id/test')
  async testWebhook(@Param('id') id: string, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.webhooksService.testWebhook(id, request.user.id, request);
    response.status(status).json(restOfResponse);
  }

  @Get(':id/deliveries')
  async getWebhookDeliveries(@Param('id') id: string, @Query() filter: WebhookFilterDto, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.webhooksService.getWebhookDeliveries(id, request.user.id, filter);
    response.status(status).json(restOfResponse);
  }

  @Put(':id/toggle')
  async toggleWebhookStatus(
    @Param('id') id: string,
    @Body() toggleWebhookStatusDto: ToggleWebhookStatusDto,
    @Req() request: any,
    @Res() response: Response
  ) {
    const { status, ...restOfResponse } = await this.webhooksService.toggleWebhookStatus(id, request.user.id, toggleWebhookStatusDto, request);
    response.status(status).json(restOfResponse);
  }

  @Get('events')
  async getWebhookEvents(@Res() response: Response) {
    const { status, ...restOfResponse } = await this.webhooksService.getWebhookEvents();
    response.status(status).json(restOfResponse);
  }
}
