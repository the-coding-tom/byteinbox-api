import { Controller, Post, Delete, Body, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { AccountService } from './account.service';

@Controller('api/v1/account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post('deactivate')
  async deactivateAccount(@Req() request: any, @Res() response: Response): Promise<void> {
    const { status, ...restOfResponse } = await this.accountService.deactivateAccount(
      request.user.id,
    );
    response.status(status).json(restOfResponse);
  }

  @Delete('delete')
  async deleteAccount(
    @Req() request: any,
    @Body() body: { password: string },
    @Res() response: Response,
  ): Promise<void> {
    const { status, ...restOfResponse } = await this.accountService.deleteAccount(
      request.user.id,
      body.password,
    );
    response.status(status).json(restOfResponse);
  }
}
