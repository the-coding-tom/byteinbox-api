import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto, UpdateTemplateDto, TemplateFilterDto } from './dto/templates.dto';

@Controller('api/v1/templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post()
  async createTemplate(@Body() createTemplateDto: CreateTemplateDto, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.templatesService.createTemplate(request.user.id, createTemplateDto, request);
    response.status(status).json(restOfResponse);
  }

  @Get()
  async getTemplates(@Query() filter: TemplateFilterDto, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.templatesService.getTemplates(request.user.id, filter);
    response.status(status).json(restOfResponse);
  }

  @Get(':id')
  async getTemplateDetails(@Param('id') id: string, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.templatesService.getTemplateDetails(id, request.user.id);
    response.status(status).json(restOfResponse);
  }

  @Put(':id')
  async updateTemplate(@Param('id') id: string, @Body() updateTemplateDto: UpdateTemplateDto, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.templatesService.updateTemplate(id, request.user.id, updateTemplateDto, request);
    response.status(status).json(restOfResponse);
  }

  @Delete(':id')
  async deleteTemplate(@Param('id') id: string, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.templatesService.deleteTemplate(id, request.user.id, request);
    response.status(status).json(restOfResponse);
  }

  @Post(':id/duplicate')
  async duplicateTemplate(@Param('id') id: string, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.templatesService.duplicateTemplate(id, request.user.id, request);
    response.status(status).json(restOfResponse);
  }
}
