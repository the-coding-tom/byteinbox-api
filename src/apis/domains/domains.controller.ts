import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { DomainsService } from './domains.service';
import { AddDomainDto, GetDomainsFilterDto, UpdateDomainDto, UpdateDomainConfigurationDto } from './dto/domains.dto';

@Controller('api/v1/domains')
export class DomainsController {
    constructor(private readonly domainsService: DomainsService) { }

    @Post()
    async addDomain(@Body() addDomainDto: AddDomainDto, @Req() request: any, @Res() response: Response) {
        const { status, ...restOfResponse } = await this.domainsService.createDomain(request.user.id, addDomainDto, request);
        response.status(status).json(restOfResponse);
    }

    @Get()
    async getDomains(@Query() filter: GetDomainsFilterDto, @Req() request: any, @Res() response: Response) {
        const { status, ...restOfResponse } = await this.domainsService.getDomains(request.user.id, filter);
        response.status(status).json(restOfResponse);
    }

    @Get(':id')
    async getDomainDetails(@Param('id') id: string, @Req() request: any, @Res() response: Response) {
        const { status, ...restOfResponse } = await this.domainsService.getDomainDetails(id, request.user.id);
        response.status(status).json(restOfResponse);
    }

    @Put(':id')
    async updateDomain(@Param('id') id: string, @Body() updateDomainDto: UpdateDomainDto, @Req() request: any, @Res() response: Response) {
        const { status, ...restOfResponse } = await this.domainsService.updateDomain(id, request.user.id, updateDomainDto, request);
        response.status(status).json(restOfResponse);
    }

    @Post(':id/verify')
    async verifyDomain(@Param('id') id: string, @Req() request: any, @Res() response: Response) {
        const { status, ...restOfResponse } = await this.domainsService.verifyDomain(id, request.user.id, request);
        response.status(status).json(restOfResponse);
    }

    @Delete(':id')
    async deleteDomain(@Param('id') id: string, @Req() request: any, @Res() response: Response) {
        const { status, ...restOfResponse } = await this.domainsService.deleteDomain(id, request.user.id, request);
        response.status(status).json(restOfResponse);
    }

    @Get('regions')
    async getRegions(@Res() response: Response) {
        const { status, ...restOfResponse } = await this.domainsService.getRegions();
        response.status(status).json(restOfResponse);
    }

    @Put(':id/configuration')
    async updateDomainConfiguration(
        @Param('id') id: string,
        @Body() updateDomainConfigurationDto: UpdateDomainConfigurationDto,
        @Req() request: any,
        @Res() response: Response
    ) {
        const { status, ...restOfResponse } = await this.domainsService.updateDomainConfiguration(id, request.user.id, updateDomainConfigurationDto, request);
        response.status(status).json(restOfResponse);
    }

    @Post(':id/restart')
    async restartDomain(@Param('id') id: string, @Req() request: any, @Res() response: Response) {
        const { status, ...restOfResponse } = await this.domainsService.restartDomain(id, request.user.id, request);
        response.status(status).json(restOfResponse);
    }
}
