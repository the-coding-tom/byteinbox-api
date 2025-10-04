import { Controller, Get, Post, Patch, Body, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { TwoFactorService } from './two-factor.service';
import {
  TotpVerifySetupDto,
  TotpDisableDto,
  RegenerateBackupCodesDto,
  EmailOtpSendDto,
  EmailOtpVerifyDto,
  RecoveryInitiateDto,
  RecoveryVerifyDto,
} from './dto/two-factor.dto';

@Controller('api/v1/auth/2fa')
export class TwoFactorController {
  constructor(private readonly twoFactorService: TwoFactorService) {}

  // TOTP (Time-based One-Time Password) Endpoints
  @Get('status')
  async getTwoFactorStatus(@Req() request: any, @Res() response: Response): Promise<void> {
    const { status, ...restOfResponse } = await this.twoFactorService.getTwoFactorStatus(request.user.id);
    response.status(status).json(restOfResponse);
  }

  @Post('setup')
  async setupTotp(@Req() request: any, @Res() response: Response): Promise<void> {
    const { status, ...restOfResponse } = await this.twoFactorService.setupTotp(request.user.id);
    response.status(status).json(restOfResponse);
  }

  @Post('verify')
  async verifyTotpSetup(
    @Req() request: any,
    @Body() verifyTotpDto: TotpVerifySetupDto,
    @Res() response: Response,
  ): Promise<void> {
    const { status, ...restOfResponse } = await this.twoFactorService.verifyTotpSetup(
      request.user.id,
      verifyTotpDto,
    );
    response.status(status).json(restOfResponse);
  }

  @Patch('disable')
  async disableTotp(
    @Req() request: any,
    @Body() disableTotpDto: TotpDisableDto,
    @Res() response: Response,
  ): Promise<void> {
    const { status, ...restOfResponse } = await this.twoFactorService.disableTotp(
      request.user.id,
      disableTotpDto,
    );
    response.status(status).json(restOfResponse);
  }

  // Backup Codes Endpoints
  @Post('backup-codes/generate')
  async regenerateBackupCodes(
    @Req() request: any,
    @Body() regenerateBackupCodesDto: RegenerateBackupCodesDto,
    @Res() response: Response,
  ): Promise<void> {
    const { status, ...restOfResponse } = await this.twoFactorService.regenerateBackupCodes(
      request.user.id,
      regenerateBackupCodesDto,
    );
    response.status(status).json(restOfResponse);
  }

  @Get('backup-codes')
  async getBackupCodes(@Req() request: any, @Res() response: Response): Promise<void> {
    const { status, ...restOfResponse } = await this.twoFactorService.getBackupCodes(request.user.id);
    response.status(status).json(restOfResponse);
  }

  // Email OTP Endpoints
  @Post('email/send')
  async sendEmailOtp(
    @Body() emailOtpDto: EmailOtpSendDto,
    @Res() response: Response,
  ): Promise<void> {
    const { status, ...restOfResponse } = await this.twoFactorService.sendEmailOtp(emailOtpDto);
    response.status(status).json(restOfResponse);
  }

  @Post('email/verify')
  async verifyEmailOtp(
    @Body() verifyEmailOtpDto: EmailOtpVerifyDto,
    @Res() response: Response,
  ): Promise<void> {
    const { status, ...restOfResponse } = await this.twoFactorService.verifyEmailOtp(verifyEmailOtpDto);
    response.status(status).json(restOfResponse);
  }

  // Recovery Session Endpoints
  @Post('recovery/initiate')
  async initiateRecovery(
    @Body() recoveryInitiateDto: RecoveryInitiateDto,
    @Res() response: Response,
  ): Promise<void> {
    const { status, ...restOfResponse } = await this.twoFactorService.initiateRecovery(recoveryInitiateDto);
    response.status(status).json(restOfResponse);
  }

  @Post('recovery/verify')
  async verifyRecovery(
    @Body() recoveryVerifyDto: RecoveryVerifyDto,
    @Res() response: Response,
  ): Promise<void> {
    const { status, ...restOfResponse } = await this.twoFactorService.verifyRecovery(recoveryVerifyDto);
    response.status(status).json(restOfResponse);
  }

  // Activity Tracking Endpoints
  @Get('activity')
  async getTwoFactorActivity(@Req() request: any, @Res() response: Response): Promise<void> {
    const { status, ...restOfResponse } = await this.twoFactorService.getTwoFactorActivity(request.user.id);
    response.status(status).json(restOfResponse);
  }
}
