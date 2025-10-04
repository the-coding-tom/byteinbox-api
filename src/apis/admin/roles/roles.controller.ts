import { Controller, Get, Post, Put, Delete, Body, Param, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { AdminRolesService } from './roles.service';
import { RequirePermission } from '../../../common/decorators';
import { PermissionName } from '@prisma/client';
import {
  GetRolesDto,
  CreateRoleDto,
  UpdateRoleDto,
  AssignPermissionDto,
} from './dto/roles.dto';

@Controller('api/v1/admin/roles')
export class AdminRolesController {
  constructor(private readonly adminRolesService: AdminRolesService) {}

  @Get()
  @RequirePermission(PermissionName.VIEW_USERS)
  async getRoles(@Query() query: GetRolesDto, @Res() res: Response) {
    const { status, ...restOfResponse } = await this.adminRolesService.getRoles(query);
    return res.status(status).json(restOfResponse);
  }

  @Post()
  @RequirePermission(PermissionName.CREATE_USERS)
  async createRole(@Body() createRoleDto: CreateRoleDto, @Res() res: Response) {
    const { status, ...restOfResponse } = await this.adminRolesService.createRole(createRoleDto);
    return res.status(status).json(restOfResponse);
  }

  @Get(':id')
  @RequirePermission(PermissionName.VIEW_USERS)
  async getRole(@Param('id') id: string, @Res() res: Response) {
    const { status, ...restOfResponse } = await this.adminRolesService.getRole(parseInt(id));
    return res.status(status).json(restOfResponse);
  }

  @Put(':id')
  @RequirePermission(PermissionName.UPDATE_USERS)
  async updateRole(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto, @Res() res: Response) {
    const { status, ...restOfResponse } = await this.adminRolesService.updateRole(parseInt(id), updateRoleDto);
    return res.status(status).json(restOfResponse);
  }

  @Delete(':id')
  @RequirePermission(PermissionName.DELETE_USERS)
  async deleteRole(@Param('id') id: string, @Res() res: Response) {
    const { status, ...restOfResponse } = await this.adminRolesService.deleteRole(parseInt(id));
    return res.status(status).json(restOfResponse);
  }

  @Get(':id/permissions')
  @RequirePermission(PermissionName.VIEW_USERS)
  async getRolePermissions(@Param('id') id: string, @Res() res: Response) {
    const { status, ...restOfResponse } = await this.adminRolesService.getRolePermissions(parseInt(id));
    return res.status(status).json(restOfResponse);
  }

  @Post(':id/permissions')
  @RequirePermission(PermissionName.UPDATE_USERS)
  async assignPermissionToRole(
    @Param('id') id: string,
    @Body() assignPermissionDto: AssignPermissionDto,
    @Res() res: Response
  ) {
    const { status, ...restOfResponse } = await this.adminRolesService.assignPermissionToRole(parseInt(id), assignPermissionDto);
    return res.status(status).json(restOfResponse);
  }

  @Delete(':id/permissions/:permissionId')
  @RequirePermission(PermissionName.UPDATE_USERS)
  async removePermissionFromRole(
    @Param('id') id: string,
    @Param('permissionId') permissionId: string,
    @Res() res: Response
  ) {
    const { status, ...restOfResponse } = await this.adminRolesService.removePermissionFromRole(parseInt(id), parseInt(permissionId));
    return res.status(status).json(restOfResponse);
  }
} 