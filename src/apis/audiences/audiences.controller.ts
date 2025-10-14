import { Controller, Get, Post, Put, Delete, Param, Query, Body, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { AudiencesService } from './audiences.service';
import { AudienceFilterDto, CreateContactDto, UpdateContactDto, ContactFilterDto } from './dto/audiences.dto';

@Controller('api/v1/audiences')
export class AudiencesController {
  constructor(
    private readonly audiencesService: AudiencesService,
  ) {}

  @Get()
  async getAudiences(@Query() filter: AudienceFilterDto, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.audiencesService.getAudiences(request.user.id, filter);
    response.status(status).json(restOfResponse);
  }

  @Get('statuses')
  async getAudienceStatuses(@Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.audiencesService.getAudienceStatuses(request.user.id);
    response.status(status).json(restOfResponse);
  }

  // Contact management within audience
  @Post(':audienceId/contacts')
  async createContact(
    @Param('audienceId') audienceId: string,
    @Body() createContactDto: CreateContactDto,
    @Req() request: any,
    @Res() response: Response,
  ) {
    const { status, ...restOfResponse } = await this.audiencesService.createContactInAudience(
      audienceId,
      request.user.id,
      createContactDto,
      request,
    );
    response.status(status).json(restOfResponse);
  }

  @Get(':audienceId/contacts')
  async getAudienceContacts(
    @Param('audienceId') audienceId: string,
    @Query() filter: ContactFilterDto,
    @Req() request: any,
    @Res() response: Response,
  ) {
    const { status, ...restOfResponse } = await this.audiencesService.getAudienceContacts(audienceId, request.user.id, filter);
    response.status(status).json(restOfResponse);
  }

  @Get(':audienceId/contacts/stats')
  async getContactStats(@Param('audienceId') audienceId: string, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.audiencesService.getContactStatsByAudience(audienceId, request.user.id);
    response.status(status).json(restOfResponse);
  }

  @Get(':audienceId/contacts/:contactId')
  async getContactDetails(
    @Param('audienceId') audienceId: string,
    @Param('contactId') contactId: string,
    @Req() request: any,
    @Res() response: Response,
  ) {
    const { status, ...restOfResponse } = await this.audiencesService.getContactDetails(contactId, request.user.id, audienceId);
    response.status(status).json(restOfResponse);
  }

  @Put(':audienceId/contacts/:contactId')
  async updateContact(
    @Param('audienceId') audienceId: string,
    @Param('contactId') contactId: string,
    @Body() updateContactDto: UpdateContactDto,
    @Req() request: any,
    @Res() response: Response,
  ) {
    const { status, ...restOfResponse } = await this.audiencesService.updateContact(
      contactId,
      request.user.id,
      updateContactDto,
      request,
      audienceId,
    );
    response.status(status).json(restOfResponse);
  }

  @Delete(':audienceId/contacts/:contactId')
  async deleteContact(
    @Param('audienceId') audienceId: string,
    @Param('contactId') contactId: string,
    @Req() request: any,
    @Res() response: Response,
  ) {
    const { status, ...restOfResponse } = await this.audiencesService.deleteContact(contactId, request.user.id, request, audienceId);
    response.status(status).json(restOfResponse);
  }

  @Post(':audienceId/contacts/:contactId/unsubscribe')
  async unsubscribeContact(
    @Param('audienceId') audienceId: string,
    @Param('contactId') contactId: string,
    @Req() request: any,
    @Res() response: Response,
  ) {
    const { status, ...restOfResponse } = await this.audiencesService.unsubscribeContact(
      contactId,
      request.user.id,
      request,
      audienceId,
    );
    response.status(status).json(restOfResponse);
  }
}
