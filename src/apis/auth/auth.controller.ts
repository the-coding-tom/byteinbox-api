import { Controller, Post, Body, Req, Res, Get, Query } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, OAuthCallbackDto, LogoutDto, RefreshTokenDto, ResetPasswordRequestDto, ResetPasswordConfirmDto, ChangePasswordDto, RegisterDto, VerifyEmailDto, ResendVerificationDto, MfaVerifyDto, MfaChallengeDto, MfaBackupCodeConsumeDto, MfaDisableDto, MfaRegenerateBackupCodesDto } from './dto/auth.dto';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Email Registration Endpoints
  @Post('register')
  async register(@Body() registerDto: RegisterDto, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.authService.register(registerDto, request);
    response.status(status).json(restOfResponse);
  }

  // Email Login Endpoints
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.authService.login(loginDto, request);
    response.status(status).json(restOfResponse);
  }

  // Session Management Endpoints
  @Post('logout')
  async logout(@Body() logoutDto: LogoutDto, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.authService.logout(logoutDto, request);
    response.status(status).json(restOfResponse);
  }

  @Post('refresh')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.authService.refreshToken(refreshTokenDto, request);
    response.status(status).json(restOfResponse);
  }

  @Post('logout-all-devices')
  async logoutAllDevices(@Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.authService.logoutAllDevices(request.user.id, request);
    response.status(status).json(restOfResponse);
  }

  // Password Management Endpoints
  @Post('reset-password/request')
  async requestPasswordReset(@Body() resetPasswordRequestDto: ResetPasswordRequestDto, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.authService.requestPasswordReset(resetPasswordRequestDto, request);
    response.status(status).json(restOfResponse);
  }

  @Post('reset-password/confirm')
  async confirmPasswordReset(@Body() resetPasswordConfirmDto: ResetPasswordConfirmDto, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.authService.confirmPasswordReset(resetPasswordConfirmDto, request);
    response.status(status).json(restOfResponse);
  }

  @Post('change-password')
  async changePassword(@Body() changePasswordDto: ChangePasswordDto, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.authService.changePassword(changePasswordDto, request.user.id, request);
    response.status(status).json(restOfResponse);
  }

  // Email Verification Endpoints
  @Post('verify-email')
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.authService.verifyEmail(verifyEmailDto);
    response.status(status).json(restOfResponse);
  }

  @Post('resend-verification')
  async resendVerification(@Body() resendVerificationDto: ResendVerificationDto, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.authService.resendVerification(resendVerificationDto);
    response.status(status).json(restOfResponse);
  }

  // MFA Endpoints
  @Post('mfa/setup')
  async setupMfa(@Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.authService.setupMfa(request.user.id);
    response.status(status).json(restOfResponse);
  }

  @Post('mfa/verify')
  async verifyMfa(@Req() request: any, @Body() mfaVerifyDto: MfaVerifyDto, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.authService.verifyMfa(request.user.id, mfaVerifyDto);
    response.status(status).json(restOfResponse);
  }

  @Post('mfa/challenge')
  async challengeMfa(@Body() mfaChallengeDto: MfaChallengeDto, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.authService.challengeMfa(mfaChallengeDto, request);
    response.status(status).json(restOfResponse);
  }

  @Get('mfa/backup-codes')
  async getBackupCodes(@Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.authService.getBackupCodes(request.user.id);
    response.status(status).json(restOfResponse);
  }

  @Post('mfa/backup-codes/consume')
  async consumeBackupCode(@Body() mfaBackupCodeConsumeDto: MfaBackupCodeConsumeDto, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.authService.consumeBackupCode(mfaBackupCodeConsumeDto, request);
    response.status(status).json(restOfResponse);
  }

  @Post('mfa/disable')
  async disableMfa(@Body() mfaDisableDto: MfaDisableDto, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.authService.disableMfa(request.user.id, mfaDisableDto, request);
    response.status(status).json(restOfResponse);
  }

  @Post('mfa/backup-codes/regenerate')
  async regenerateBackupCodes(@Body() mfaRegenerateBackupCodesDto: MfaRegenerateBackupCodesDto, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.authService.regenerateBackupCodes(request.user.id, mfaRegenerateBackupCodesDto, request);
    response.status(status).json(restOfResponse);
  }

  // OAuth Endpoints
  @Get('google')
  async getGoogleOAuthUrl(@Res() response: Response) {
    const { status, ...restOfResponse } = await this.authService.getGoogleOAuthUrl();
    response.status(status).json(restOfResponse);
  }

  @Get('google/callback')
  async handleGoogleCallback(@Query() query: OAuthCallbackDto, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.authService.handleGoogleCallback(query, request);
    response.status(status).json(restOfResponse);
  }

  @Get('github')
  async getGitHubOAuthUrl(@Res() response: Response) {
    const { status, ...restOfResponse } = await this.authService.getGitHubOAuthUrl();
    response.status(status).json(restOfResponse);
  }

  @Get('github/callback')
  async handleGitHubCallback(@Query() query: OAuthCallbackDto, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.authService.handleGitHubCallback(query, request);
    response.status(status).json(restOfResponse);
  }
}
