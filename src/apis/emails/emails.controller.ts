import { Controller, Get, Post, Body, Param, Query, Req, Res } from '@nestjs/common';
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

  @Post('aws-sns-callback')
  async handleAwsSnsCallback(@Body() body: any, @Req() request: any, @Res() response: Response) {
    const messageType = request.headers['x-amz-sns-message-type'];
    const { status, ...restOfResponse } = await this.emailsService.handleAwsSnsEvent(messageType, body);
    response.status(status).json(restOfResponse);
  }
}
