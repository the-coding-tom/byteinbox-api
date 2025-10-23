import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { DomainsService } from './domains.service';
import { AddDomainDto, GetDomainsFilterDto, UpdateDomainSettingsDto } from './dto/domains.dto';

@Controller('api/v1/domains')
export class DomainsController {
    constructor(private readonly domainsService: DomainsService) { }

    @Post()
    async addDomain(@Body() addDomainDto: AddDomainDto, @Req() request: any, @Res() response: Response) {
        const { status, ...restOfResponse } = await this.domainsService.addDomain(request.user.id, request.teamId, addDomainDto);
        response.status(status).json(restOfResponse);
    }

    @Get()
    async getDomains(@Query() filter: GetDomainsFilterDto, @Req() request: any, @Res() response: Response) {
        const { status, ...restOfResponse } = await this.domainsService.getDomains(request.teamId, filter);
        response.status(status).json(restOfResponse);
    }

    @Get(':id')
    async getDomainDetails(@Param('id') id: string, @Req() request: any, @Res() response: Response) {
        const { status, ...restOfResponse } = await this.domainsService.getDomainDetails(id, request.teamId);
        response.status(status).json(restOfResponse);
    }

    @Delete(':id')
    async deleteDomain(@Param('id') id: string, @Req() request: any, @Res() response: Response) {
        const { status, ...restOfResponse } = await this.domainsService.deleteDomain(id, request.teamId);
        response.status(status).json(restOfResponse);
    }

    @Put(':id/settings')
    async updateDomainSettings(@Param('id') id: string, @Body() updateDomainSettingsDto: UpdateDomainSettingsDto, @Req() request: any, @Res() response: Response) {
        const { status, ...restOfResponse } = await this.domainsService.updateDomainSettings(id, request.teamId, updateDomainSettingsDto);
        response.status(status).json(restOfResponse);
    }

    @Post(':id/restart')
    async restartDomain(@Param('id') id: string, @Req() request: any, @Res() response: Response) {
        const { status, ...restOfResponse } = await this.domainsService.restartDomain(id, request.teamId);
        response.status(status).json(restOfResponse);
    }
}
