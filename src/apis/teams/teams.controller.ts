import { Controller, Get, Post, Put, Delete, Body, Param, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { TeamsService } from './teams.service';
import {
  CreateTeamDto,
  UpdateTeamDto,
  InviteTeamMemberDto,
  UpdateTeamMemberRoleDto,
} from './dto/teams.dto';

@Controller('api/v1/teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  async getUserTeams(@Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.teamsService.getUserTeams(request.user.id);
    return response.status(status).json(restOfResponse);
  }

  @Post()
  async createTeam(@Body() createTeamDto: CreateTeamDto, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.teamsService.createTeam(createTeamDto, request.user.id);
    return response.status(status).json(restOfResponse);
  }

  @Get(':id')
  async getTeamDetails(@Param('id') id: string, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.teamsService.getTeamDetails(id, request.user.id);
    return response.status(status).json(restOfResponse);
  }

  @Put(':id')
  async updateTeam(@Param('id') id: string, @Body() updateTeamDto: UpdateTeamDto, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.teamsService.updateTeam(id, updateTeamDto, request.user.id);
    return response.status(status).json(restOfResponse);
  }

  @Delete(':id')
  async deleteTeam(@Param('id') id: string, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.teamsService.deleteTeam(id, request.user.id);
    return response.status(status).json(restOfResponse);
  }

  @Get(':id/members')
  async getTeamMembers(@Param('id') id: string, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.teamsService.getTeamMembers(id, request.user.id);
    return response.status(status).json(restOfResponse);
  }

  @Post(':id/invite')
  async inviteTeamMember(@Param('id') id: string, @Body() inviteTeamMemberDto: InviteTeamMemberDto, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.teamsService.inviteTeamMember(id, inviteTeamMemberDto, request.user.id);
    return response.status(status).json(restOfResponse);
  }

  @Post('invitations/:token/accept')
  async acceptInvitation(@Param('token') token: string, @Req() request: any, @Res() response: Response) {
    // TODO: Implement acceptInvitation method in service
    const { status, ...restOfResponse } = { status: 200, message: 'Invitation accepted' };
    return response.status(status).json(restOfResponse);
  }

  @Put(':id/members/:memberId/role')
  async updateTeamMemberRole(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() updateTeamMemberRoleDto: UpdateTeamMemberRoleDto,
    @Req() request: any,
    @Res() response: Response,
  ) {
    const { status, ...restOfResponse } = await this.teamsService.updateTeamMemberRole(
      id,
      memberId,
      updateTeamMemberRoleDto,
      request.user.id,
    );
    return response.status(status).json(restOfResponse);
  }

  @Delete(':id/members/:memberId')
  async removeTeamMember(@Param('id') id: string, @Param('memberId') memberId: string, @Req() request: any, @Res() response: Response) {
    const { status, ...restOfResponse } = await this.teamsService.removeTeamMember(id, memberId, request.user.id);
    return response.status(status).json(restOfResponse);
  }
} 