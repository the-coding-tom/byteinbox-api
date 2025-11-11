import { Controller, Post, Body, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { CallbacksService } from './callbacks.service';

@Controller('api/v1/callbacks')
export class CallbacksController {
  constructor(private readonly callbacksService: CallbacksService) { }

  @Post('aws-sns')
  async handleAwsSnsCallback(@Body() body: any, @Req() request: any, @Res() response: Response) {
    const messageType = request.headers['x-amz-sns-message-type'];
    const { status, ...restOfResponse } = await this.callbacksService.handleAwsSnsCallback(messageType, body);
    response.status(status).json(restOfResponse);
  }
}
