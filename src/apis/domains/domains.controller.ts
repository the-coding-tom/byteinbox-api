import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { DomainsService } from './domains.service';
import { AddDomainDto, GetDomainsFilterDto, UpdateDomainConfigurationDto } from './dto/domains.dto';

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

    @Post(':id/verify')
    async verifyDomain(@Param('id') id: string, @Req() request: any, @Res() response: Response) {
        const { status, ...restOfResponse } = await this.domainsService.verifyDomain(id, request.teamId);
        response.status(status).json(restOfResponse);
    }

    @Delete(':id')
    async deleteDomain(@Param('id') id: string, @Req() request: any, @Res() response: Response) {
        const { status, ...restOfResponse } = await this.domainsService.deleteDomain(id, request.teamId);
        response.status(status).json(restOfResponse);
    }

    @Put(':id/configuration')
    async updateDomainConfiguration(@Param('id') id: string, @Body() updateDomainConfigurationDto: UpdateDomainConfigurationDto, @Req() request: any, @Res() response: Response) {
        const { status, ...restOfResponse } = await this.domainsService.updateDomainConfiguration(id, request.teamId, updateDomainConfigurationDto);
        response.status(status).json(restOfResponse);
    }

    @Post(':id/restart')
    async restartDomain(@Param('id') id: string, @Req() request: any, @Res() response: Response) {
        const { status, ...restOfResponse } = await this.domainsService.restartDomain(id, request.teamId);
        response.status(status).json(restOfResponse);
    }
}
