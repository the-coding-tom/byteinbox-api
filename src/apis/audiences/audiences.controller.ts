import { Controller, Get, Param, Query, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { AudiencesService } from './audiences.service';
import { AudienceFilterDto } from './dto/audiences.dto';

@Controller('api/v1/audiences')
export class AudiencesController {
  constructor(private readonly audiencesService: AudiencesService) {}

  @Get()
  async getAudiences(@Query() filter: AudienceFilterDto, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.audiencesService.getAudiences(request.user.id, filter);
    response.status(status).json(restOfResponse);
  }

  @Get(':id/contacts')
  async getAudienceContacts(@Param('id') id: string, @Query() filter: AudienceFilterDto, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.audiencesService.getAudienceContacts(id, request.user.id, filter);
    response.status(status).json(restOfResponse);
  }

  @Get('statuses')
  async getAudienceStatuses(@Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.audiencesService.getAudienceStatuses(request.user.id);
    response.status(status).json(restOfResponse);
  }
}
