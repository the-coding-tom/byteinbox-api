import { Controller, Get, Put, Body, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/profile.dto';

@Controller('api/v1/profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) { }

  @Get()
  async getProfile(@Req() request: any, @Res() response: Response): Promise<void> {
    const { status, ...restOfResponse } = await this.profileService.getProfile(request.user.id);
    response.status(status).json(restOfResponse);
  }

  @Put()
  async updateProfile(
    @Req() request: any,
    @Body() updateProfileDto: UpdateProfileDto,
    @Res() response: Response,
  ): Promise<void> {
    const { status, ...restOfResponse } = await this.profileService.updateProfile(
      request.user.id,
      updateProfileDto,
    );
    response.status(status).json(restOfResponse);
  }
} 