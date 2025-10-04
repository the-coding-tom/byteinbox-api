import { Controller, Get, Post, Put, Delete, Body, Query, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { AdminSecurityService } from './security.service';
import {
  GetSecurityActivityDto,
  GetBlacklistStatsDto,
  GetRateLimitStatsDto,
  ClearUserRateLimitsDto,
  CreateBlacklistEntryDto,
  UpdateBlacklistEntryDto,
  GetBlacklistEntriesDto,
} from './dto/security.dto';

@Controller('api/v1/admin/security')
export class AdminSecurityController {
  constructor(private readonly adminSecurityService: AdminSecurityService) {}

  // Existing endpoints (more specific routes first)
  @Get('activity')
  async getSecurityActivity(@Query() filter: GetSecurityActivityDto, @Res() res: Response) {
    const { status, ...restOfResponse } = await this.adminSecurityService.getSecurityActivity(filter);
    return res.status(status).json(restOfResponse);
  }

  @Get('blacklist/stats')
  async getBlacklistStats(@Query() filter: GetBlacklistStatsDto, @Res() res: Response) {
    const { status, ...restOfResponse } = await this.adminSecurityService.getBlacklistStats(filter);
    return res.status(status).json(restOfResponse);
  }

  @Get('rate-limits/stats')
  async getRateLimitStats(@Query() filter: GetRateLimitStatsDto, @Res() res: Response) {
    const { status, ...restOfResponse } = await this.adminSecurityService.getRateLimitStats(filter);
    return res.status(status).json(restOfResponse);
  }

  @Post('rate-limits/clear')
  async clearUserRateLimits(@Body() clearDto: ClearUserRateLimitsDto, @Res() res: Response) {
    const { status, ...restOfResponse } = await this.adminSecurityService.clearUserRateLimits(clearDto);
    return res.status(status).json(restOfResponse);
  }

  @Post('blacklist/:id/clear')
  async clearBlacklistEntry(@Param('id') id: string, @Res() res: Response) {
    const clearDto = { id: parseInt(id) };
    const { status, ...restOfResponse } = await this.adminSecurityService.clearBlacklistEntry(clearDto);
    return res.status(status).json(restOfResponse);
  }

  // Blacklist CRUD Management (less specific routes last)
  @Get('blacklist')
  async getBlacklistEntries(@Query() filter: GetBlacklistEntriesDto, @Res() res: Response) {
    const { status, ...restOfResponse } = await this.adminSecurityService.getBlacklistEntries(filter);
    return res.status(status).json(restOfResponse);
  }

  @Post('blacklist')
  async createBlacklistEntry(@Body() createDto: CreateBlacklistEntryDto, @Res() res: Response) {
    const { status, ...restOfResponse } = await this.adminSecurityService.createBlacklistEntry(createDto);
    return res.status(status).json(restOfResponse);
  }

  @Get('blacklist/:id')
  async getBlacklistEntry(@Param('id') id: string, @Res() res: Response) {
    const { status, ...restOfResponse } = await this.adminSecurityService.getBlacklistEntry(parseInt(id));
    return res.status(status).json(restOfResponse);
  }

  @Put('blacklist/:id')
  async updateBlacklistEntry(@Param('id') id: string, @Body() updateDto: UpdateBlacklistEntryDto, @Res() res: Response) {
    const { status, ...restOfResponse } = await this.adminSecurityService.updateBlacklistEntry(parseInt(id), updateDto);
    return res.status(status).json(restOfResponse);
  }

  @Delete('blacklist/:id')
  async deleteBlacklistEntry(@Param('id') id: string, @Res() res: Response) {
    const { status, ...restOfResponse } = await this.adminSecurityService.deleteBlacklistEntry(parseInt(id));
    return res.status(status).json(restOfResponse);
  }
} 