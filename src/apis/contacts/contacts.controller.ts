import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { ContactsService } from './contacts.service';
import { CreateContactDto, UpdateContactDto, ContactFilterDto } from './dto/contacts.dto';

@Controller('api/v1/contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  async createContact(@Body() createContactDto: CreateContactDto, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.contactsService.createContact(request.user.id, createContactDto, request);
    response.status(status).json(restOfResponse);
  }

  @Get()
  async getContacts(@Query() filter: ContactFilterDto, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.contactsService.getContacts(request.user.id, filter);
    response.status(status).json(restOfResponse);
  }

  @Get(':id')
  async getContactDetails(@Param('id') id: string, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.contactsService.getContactDetails(id, request.user.id);
    response.status(status).json(restOfResponse);
  }

  @Put(':id')
  async updateContact(@Param('id') id: string, @Body() updateContactDto: UpdateContactDto, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.contactsService.updateContact(id, request.user.id, updateContactDto, request);
    response.status(status).json(restOfResponse);
  }

  @Delete(':id')
  async deleteContact(@Param('id') id: string, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.contactsService.deleteContact(id, request.user.id, request);
    response.status(status).json(restOfResponse);
  }

  @Post(':id/unsubscribe')
  async unsubscribeContact(@Param('id') id: string, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.contactsService.unsubscribeContact(id, request.user.id, request);
    response.status(status).json(restOfResponse);
  }

  @Get('stats/overview')
  async getContactStats(@Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.contactsService.getContactStats(request.user.id);
    response.status(status).json(restOfResponse);
  }
}
