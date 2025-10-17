import { Controller, Post, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { OnboardingService } from './onboarding.service';

@Controller('api/v1')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post('send-test-email')
  async sendSimpleTestEmail(@Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.onboardingService.sendSimpleTestEmail(request.user.id, request);
    response.status(status).json(restOfResponse);
  }
}
