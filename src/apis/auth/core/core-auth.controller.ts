import { Controller, Post, Body, Get, Req, Res, Param, Query } from '@nestjs/common';
import { Response } from 'express';
import { CoreAuthService } from './core-auth.service';
import {
  RegisterDto,
  LoginDto,
  OAuthLoginDto,
  RefreshTokenDto,
  VerifyEmailDto,
  ResendVerificationDto,
  OAuthCallbackDto,
} from './dto/core-auth.dto';

@Controller('api/v1/auth')
export class CoreAuthController {
  constructor(private readonly authService: CoreAuthService) {}

  // Basic Authentication Endpoints
  @Post('register')
  async register(@Body() registerDto: RegisterDto, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.authService.register(registerDto);
    return response.status(status).json(restOfResponse);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.authService.login(loginDto, request);
    return response.status(status).json(restOfResponse);
  }

  @Post('logout')
  async logout(@Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.authService.logout(request.user.id);
    return response.status(status).json(restOfResponse);
  }

  @Post('refresh')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.authService.refreshToken(refreshTokenDto);
    return response.status(status).json(restOfResponse);
  }

  // OAuth Authentication Endpoints
  @Post('oauth/login')
  async oauthLogin(@Body() oauthLoginDto: OAuthLoginDto, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.authService.oauthLogin(oauthLoginDto, request);
    return response.status(status).json(restOfResponse);
  }

  @Get('oauth/:provider/url')
  async getOAuthUrl(@Param('provider') provider: string, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.authService.getOAuthUrl(provider);
    return response.status(status).json(restOfResponse);
  }

  // OAuth Callback Handler (for testing)
  @Get('callback')
  async oauthCallback(@Query() query: OAuthCallbackDto, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.authService.handleOAuthCallback(query);
    return response.status(status).json(restOfResponse);
  }

  // Email Verification Endpoints
  @Get('verify-email')
  async verifyEmail(@Query() query: VerifyEmailDto, @Res() response: Response): Promise<void> {
    const { status, ...restOfResponse } = await this.authService.verifyEmail(query);
    response.status(status).json(restOfResponse);
  }

  @Post('resend-verification')
  async resendVerification(
    @Body() resendVerificationDto: ResendVerificationDto,
    @Res() response: Response,
  ): Promise<void> {
    const { status, ...restOfResponse } =
      await this.authService.resendVerification(resendVerificationDto);
    response.status(status).json(restOfResponse);
  }
}
