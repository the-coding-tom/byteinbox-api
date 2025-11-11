import { Controller, Get, Post, Patch, Body, Param, Query, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { EmailsService } from './emails.service';
import { SendEmailDto, EmailFilterDto } from './dto/emails.dto';

@Controller('api/v1/emails')
export class EmailsController {
  constructor(private readonly emailsService: EmailsService) { }

  @Post()
  async sendEmail(@Body() sendEmailDto: SendEmailDto, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.emailsService.sendEmail(request, sendEmailDto);
    response.status(status).json(restOfResponse);
  }

  @Post('batch')
  async sendBatchEmail(@Body() emails: SendEmailDto[], @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.emailsService.sendBatchEmail(request, emails);
    response.status(status).json(restOfResponse);
  }

  @Get()
  async getEmails(@Query() filter: EmailFilterDto, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.emailsService.getEmails(request, filter);
    response.status(status).json(restOfResponse);
  }

  @Get(':id')
  async getEmailDetails(@Param('id') id: string, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.emailsService.getEmailDetails(request, id);
    response.status(status).json(restOfResponse);
  }

  @Get(':email_id/attachments')
  async getAttachments(
    @Param('email_id') emailId: string,
    @Req() request: any,
    @Res() response: Response
  ) {
    const { status, ...restOfResponse } = await this.emailsService.getAttachments(request, emailId);
    response.status(status).json(restOfResponse);
  }

  @Get(':email_id/attachments/:id')
  async getAttachment(
    @Param('email_id') emailId: string,
    @Param('id') attachmentId: string,
    @Req() request: any,
    @Res() response: Response
  ) {
    const { status, ...restOfResponse } = await this.emailsService.getAttachment(request, emailId, attachmentId);
    response.status(status).json(restOfResponse);
  }

  @Patch(':id')
  async updateScheduledEmail(
    @Param('id') id: string,
    @Body() updateData: { scheduledAt: string },
    @Req() request: any,
    @Res() response: Response
  ) {
    const { status, ...restOfResponse } = await this.emailsService.updateScheduledEmail(request, id, updateData);
    response.status(status).json(restOfResponse);
  }

  @Post(':id/cancel')
  async cancelScheduledEmail(
    @Param('id') id: string,
    @Req() request: any,
    @Res() response: Response
  ) {
    const { status, ...restOfResponse } = await this.emailsService.cancelScheduledEmail(request, id);
    response.status(status).json(restOfResponse);
  }
}
