import { Controller, Get, Post, Body, Param, Query, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { EmailsService } from './emails.service';
import { SendEmailDto, EmailFilterDto } from './dto/emails.dto';

@Controller('api/v1/emails')
export class EmailsController {
  constructor(private readonly emailsService: EmailsService) { }

  @Post()
  async sendEmail(@Body() sendEmailDto: SendEmailDto, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.emailsService.sendEmail(request.user.id, sendEmailDto, request);
    response.status(status).json(restOfResponse);
  }

  @Get()
  async getEmails(@Query() filter: EmailFilterDto, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.emailsService.getEmails(request.user.id, filter);
    response.status(status).json(restOfResponse);
  }

  @Get(':id')
  async getEmailDetails(@Param('id') id: string, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.emailsService.getEmailDetails(id, request.user.id);
    response.status(status).json(restOfResponse);
  }

  @Get('stats/overview')
  async getEmailStats(@Query() filter: EmailFilterDto, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.emailsService.getEmailStats(request.user.id, filter);
    response.status(status).json(restOfResponse);
  }

  @Get('statuses')
  async getEmailStatuses(@Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.emailsService.getEmailStatuses(request.user.id);
    response.status(status).json(restOfResponse);
  }
}
