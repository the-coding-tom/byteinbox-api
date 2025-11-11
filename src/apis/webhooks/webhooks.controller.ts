import { Controller, Get, Post, Patch, Delete, Body, Param, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { WebhooksService } from './webhooks.service';
import { CreateWebhookDto, UpdateWebhookDto } from './dto/webhooks.dto';

@Controller('api/v1/webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post()
  async createWebhook(@Body() createWebhookDto: CreateWebhookDto, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.webhooksService.createWebhook(request.user.id, createWebhookDto, request);
    response.status(status).json(restOfResponse);
  }

  @Get()
  async getWebhooks(@Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.webhooksService.getWebhooks(request.user.id, request);
    response.status(status).json(restOfResponse);
  }

  @Get(':id')
  async getWebhookDetails(@Param('id') id: string, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.webhooksService.getWebhookDetails(id, request.user.id, request);
    response.status(status).json(restOfResponse);
  }

  @Patch(':id')
  async updateWebhook(@Param('id') id: string, @Body() updateWebhookDto: UpdateWebhookDto, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.webhooksService.updateWebhook(id, request.user.id, updateWebhookDto, request);
    response.status(status).json(restOfResponse);
  }

  @Delete(':id')
  async deleteWebhook(@Param('id') id: string, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.webhooksService.deleteWebhook(id, request.user.id, request);
    response.status(status).json(restOfResponse);
  }
}
