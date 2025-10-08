import { Controller, Get, Post, Patch, Body, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { OnboardingService } from './onboarding.service';
import { GenerateApiKeyDto, UpdateStepDto, SendTestEmailDto } from './dto/onboarding.dto';

@Controller('api/v1')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  // Onboarding Endpoints
  @Get('languages')
  async getLanguages(@Res() response: Response) {
    const { status, ...restOfResponse } = await this.onboardingService.getLanguages();
    response.status(status).json(restOfResponse);
  }

  @Get('steps')
  async getSteps(@Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.onboardingService.getSteps(request.user.id);
    response.status(status).json(restOfResponse);
  }

  @Post('api-keys')
  async generateApiKey(@Body() generateApiKeyDto: GenerateApiKeyDto, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.onboardingService.generateApiKey(request.user.id, generateApiKeyDto, request);
    response.status(status).json(restOfResponse);
  }

  @Patch('steps')
  async updateStep(@Body() updateStepDto: UpdateStepDto, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.onboardingService.updateStep(request.user.id, updateStepDto, request);
    response.status(status).json(restOfResponse);
  }

  @Post('emails')
  async sendTestEmail(@Body() sendTestEmailDto: SendTestEmailDto, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.onboardingService.sendTestEmail(request.user.id, sendTestEmailDto, request);
    response.status(status).json(restOfResponse);
  }
}
