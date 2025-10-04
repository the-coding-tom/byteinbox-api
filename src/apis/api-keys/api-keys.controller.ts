import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiKeysService } from './api-keys.service';
import {
  CreateApiKeyDto,
  UpdateApiKeyDto,
  GetApiKeysDto,
} from './dto/api-keys.dto';

@Controller('api/v1/api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Get()
  async getApiKeys(@Query() query: GetApiKeysDto, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.apiKeysService.getApiKeys(query, request.headers, request.user);
    return response.status(status).json(restOfResponse);
  }

  @Post()
  async createApiKey(@Body() createApiKeyDto: CreateApiKeyDto, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.apiKeysService.createApiKey(createApiKeyDto, request.headers, request.user);
    return response.status(status).json(restOfResponse);
  }

  @Get(':id')
  async getApiKey(@Param('id') id: string, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.apiKeysService.getApiKey(id, request.headers, request.user);
    return response.status(status).json(restOfResponse);
  }

  @Put(':id')
  async updateApiKey(@Param('id') id: string, @Body() updateApiKeyDto: UpdateApiKeyDto, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.apiKeysService.updateApiKey(id, updateApiKeyDto, request.headers, request.user);
    return response.status(status).json(restOfResponse);
  }

  @Delete(':id')
  async deleteApiKey(@Param('id') id: string, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.apiKeysService.deleteApiKey(id, request.headers, request.user);
    return response.status(status).json(restOfResponse);
  }

  @Get('public/test')
  async testApiKey(@Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.apiKeysService.testApiKey(request.headers);
    return response.status(status).json(restOfResponse);
  }
} 