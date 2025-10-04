import { Controller, Get, Post, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { SessionsService } from './sessions.service';

@Controller('api/v1/auth/sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  async getActiveSessions(@Req() request: any, @Res() response: Response): Promise<void> {
    const { status, ...restOfResponse } = await this.sessionsService.getActiveSessions(request.user.id);
    response.status(status).json(restOfResponse);
  }

  @Post('revoke-all')
  async revokeAllSessions(@Req() request: any, @Res() response: Response): Promise<void> {
    const { status, ...restOfResponse } = await this.sessionsService.revokeAllSessions(request.user.id);
    response.status(status).json(restOfResponse);
  }
} 