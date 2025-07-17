import { Controller, Post, Body, Get, Req, Res, Param, Query, Put, Delete } from '@nestjs/common';
import { Response } from 'express';

import { AuthenticatedRequest } from '../../common/middlewares/auth.middleware';

import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  OAuthLoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
  SendOtpDto,
  UpdateUserProfileDto,
  UpdateUserPasswordDto,
  ResendVerificationDto,
  SetupMfaDto,
  VerifyMfaDto,
  EnableMfaDto,
  DisableMfaDto,
  ChangePasswordDto,
} from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Basic Authentication Endpoints
  @Post('register')
  async register(@Body() registerDto: RegisterDto, @Res() res: Response) {
    const { status, ...restOfResponse } = await this.authService.register(registerDto);
    return res.status(status).json(restOfResponse);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    const { status, ...restOfResponse } = await this.authService.login(loginDto);
    return res.status(status).json(restOfResponse);
  }

  @Post('logout')
  async logout(@Body() body: { refreshToken: string }, @Res() res: Response) {
    const { status, ...restOfResponse } = await this.authService.logout(body.refreshToken);
    return res.status(status).json(restOfResponse);
  }

  @Post('refresh')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto, @Res() res: Response) {
    const { status, ...restOfResponse } = await this.authService.refreshToken(refreshTokenDto);
    return res.status(status).json(restOfResponse);
  }

  // OAuth Authentication Endpoints
  @Post('oauth/login')
  async oauthLogin(@Body() oauthLoginDto: OAuthLoginDto, @Res() res: Response) {
    const { status, ...restOfResponse } = await this.authService.oauthLogin(oauthLoginDto);
    return res.status(status).json(restOfResponse);
  }

  @Get('oauth/:provider/url')
  async getOAuthUrl(
    @Param('provider') provider: string,
    @Query('redirect_uri') redirectUri: string,
    @Res() res: Response,
  ) {
    const { status, ...restOfResponse } = await this.authService.getOAuthUrl(provider, redirectUri);
    return res.status(status).json(restOfResponse);
  }

  // OAuth Callback Handler (for testing)
  @Get('callback')
  async oauthCallback(@Query() query: any, @Res() res: Response) {
    const { status, ...restOfResponse } = await this.authService.handleOAuthCallback(query);
    return res.status(status).json(restOfResponse);
  }

  // Email Verification Endpoints
  @Post('verify-email')
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto, @Res() res: Response): Promise<void> {
    const result = await this.authService.verifyEmail(verifyEmailDto);
    res.status(result.status).json(result);
  }

  @Post('resend-verification')
  async resendVerification(
    @Body() resendVerificationDto: ResendVerificationDto,
    @Res() res: Response,
  ): Promise<void> {
    const result = await this.authService.resendVerification(resendVerificationDto);
    res.status(result.status).json(result);
  }

  // Password Reset Endpoints
  @Post('forgot-password')
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
    @Res() res: Response,
  ): Promise<void> {
    const result = await this.authService.forgotPassword(forgotPasswordDto);
    res.status(result.status).json(result);
  }

  @Post('reset-password')
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Res() res: Response,
  ): Promise<void> {
    const result = await this.authService.resetPassword(resetPasswordDto);
    res.status(result.status).json(result);
  }

  // MFA Setup and Management Endpoints
  @Post('mfa/setup')
  async setupMfa(
    @Req() req: AuthenticatedRequest,
    @Body() setupMfaDto: SetupMfaDto,
    @Res() res: Response,
  ) {
    const { status, ...restOfResponse } = await this.authService.setupMfa(req.user.id, setupMfaDto);
    return res.status(status).json(restOfResponse);
  }

  @Post('mfa/enable')
  async enableMfa(
    @Req() req: AuthenticatedRequest,
    @Body() enableMfaDto: EnableMfaDto,
    @Res() res: Response,
  ) {
    const { status, ...restOfResponse } = await this.authService.enableMfa(
      req.user.id,
      enableMfaDto,
    );
    return res.status(status).json(restOfResponse);
  }

  @Post('mfa/disable')
  async disableMfa(
    @Req() req: AuthenticatedRequest,
    @Body() disableMfaDto: DisableMfaDto,
    @Res() res: Response,
  ) {
    const { status, ...restOfResponse } = await this.authService.disableMfa(
      req.user.id,
      disableMfaDto,
    );
    return res.status(status).json(restOfResponse);
  }

  @Post('verify-mfa')
  async verifyMfa(
    @Req() req: AuthenticatedRequest,
    @Body() verifyMfaDto: VerifyMfaDto,
    @Res() res: Response,
  ): Promise<void> {
    const result = await this.authService.verifyMfa(req.user.id, verifyMfaDto);
    res.status(result.status).json(result);
  }

  // OTP Endpoints
  @Post('otp/send')
  async sendOtp(
    @Req() req: AuthenticatedRequest,
    @Body() sendOtpDto: SendOtpDto,
    @Res() res: Response,
  ) {
    const { status, ...restOfResponse } = await this.authService.sendOtp(req.user.id, sendOtpDto);
    return res.status(status).json(restOfResponse);
  }

  @Post('verify-email-otp')
  async verifyEmailOtp(
    @Body() body: { email: string; otp: string },
    @Res() res: Response,
  ): Promise<void> {
    const result = await this.authService.verifyEmailOtp(body.email, body.otp);
    res.status(result.status).json(result);
  }

  @Post('verify-sms-otp')
  async verifySmsOtp(
    @Body() body: { phoneNumber: string; otp: string },
    @Res() res: Response,
  ): Promise<void> {
    const result = await this.authService.verifySmsOtp(body.phoneNumber, body.otp);
    res.status(result.status).json(result);
  }

  @Post('verify-totp')
  async verifyTotp(@Body() body: { code: string }, @Res() res: Response): Promise<void> {
    const result = await this.authService.verifyTotp(body.code);
    res.status(result.status).json(result);
  }

  // User Profile Endpoints
  @Get('profile')
  async getProfile(@Req() req: AuthenticatedRequest, @Res() res: Response): Promise<void> {
    const result = await this.authService.getProfile(req.user.id);
    res.status(result.status).json(result);
  }

  @Put('profile')
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() updateProfileDto: UpdateUserProfileDto,
    @Res() res: Response,
  ): Promise<void> {
    const result = await this.authService.updateProfile(req.user.id, updateProfileDto);
    res.status(result.status).json(result);
  }

  @Post('change-password')
  async changePassword(
    @Req() req: AuthenticatedRequest,
    @Body() changePasswordDto: ChangePasswordDto,
    @Res() res: Response,
  ): Promise<void> {
    const result = await this.authService.changePassword(req.user.id, changePasswordDto);
    res.status(result.status).json(result);
  }

  // Account Management Endpoints
  @Post('deactivate-account')
  async deactivateAccount(@Req() req: AuthenticatedRequest, @Res() res: Response): Promise<void> {
    const result = await this.authService.deactivateAccount(req.user.id);
    res.status(result.status).json(result);
  }

  @Delete('delete-account')
  async deleteAccount(
    @Req() req: AuthenticatedRequest,
    @Body() body: { password: string },
    @Res() res: Response,
  ): Promise<void> {
    const result = await this.authService.deleteAccount(req.user.id, body.password);
    res.status(result.status).json(result);
  }

  // Session Management Endpoints
  @Get('active-sessions')
  async getActiveSessions(@Req() req: AuthenticatedRequest, @Res() res: Response): Promise<void> {
    const result = await this.authService.getActiveSessions(req.user.id);
    res.status(result.status).json(result);
  }

  @Post('revoke-all-sessions')
  async revokeAllSessions(@Req() req: AuthenticatedRequest, @Res() res: Response): Promise<void> {
    const result = await this.authService.revokeAllSessions(req.user.id);
    res.status(result.status).json(result);
  }

  // Security Activity Endpoints
  @Get('security-activity')
  async getSecurityActivity(@Req() req: AuthenticatedRequest, @Res() res: Response): Promise<void> {
    const result = await this.authService.getSecurityActivity(req.user.id);
    res.status(result.status).json(result);
  }

  // Admin Endpoints (for testing/debugging)
  @Post('reset-user-mfa')
  async resetUserMfa(@Req() req: AuthenticatedRequest, @Res() res: Response): Promise<void> {
    const result = await this.authService.resetUserMfa(req.user.id);
    res.status(result.status).json(result);
  }

  @Post('unlock-account')
  async unlockAccount(@Req() req: AuthenticatedRequest, @Res() res: Response): Promise<void> {
    const result = await this.authService.unlockAccount(req.user.id);
    res.status(result.status).json(result);
  }
}
