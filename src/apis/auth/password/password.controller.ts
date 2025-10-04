import { Controller, Post, Body, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { PasswordService } from './password.service';
import { ForgotPasswordDto, ResetPasswordDto, ChangePasswordDto } from './dto/password.dto';

@Controller('api/v1/auth/password')
export class PasswordController {
  constructor(private readonly passwordService: PasswordService) {}

  @Post('forgot')
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
    @Res() response: Response,
  ): Promise<void> {
    const { status, ...restOfResponse } = await this.passwordService.forgotPassword(forgotPasswordDto);
    response.status(status).json(restOfResponse);
  }

  @Post('reset')
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Res() response: Response,
  ): Promise<void> {
    const { status, ...restOfResponse } = await this.passwordService.resetPassword(resetPasswordDto);
    response.status(status).json(restOfResponse);
  }

  @Post('change')
  async changePassword(
    @Req() request: any,
    @Body() changePasswordDto: ChangePasswordDto,
    @Res() response: Response,
  ): Promise<void> {
    const { status, ...restOfResponse } = await this.passwordService.changePassword(
      request.user.id,
      changePasswordDto,
    );
    response.status(status).json(restOfResponse);
  }
} 