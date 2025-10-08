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
  @RequirePermission(PermissionName.ROLE_LIST)
  async getRoles(@Query() query: GetRolesDto, @Res() res: Response) {
    const { status, ...restOfResponse } = await this.adminRolesService.getRoles(query);
    return res.status(status).json(restOfResponse);
  }

  @Post()
  @RequirePermission(PermissionName.ROLE_CREATE)
  async createRole(@Body() createRoleDto: CreateRoleDto, @Res() res: Response) {
    const { status, ...restOfResponse } = await this.adminRolesService.createRole(createRoleDto);
    return res.status(status).json(restOfResponse);
  }

  @Get(':id')
  @RequirePermission(PermissionName.ROLE_READ)
  async getRole(@Param('id') id: string, @Res() res: Response) {
    const { status, ...restOfResponse } = await this.adminRolesService.getRole(parseInt(id, 10));
    return res.status(status).json(restOfResponse);
  }

  @Put(':id')
  @RequirePermission(PermissionName.ROLE_UPDATE)
  async updateRole(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto, @Res() res: Response) {
    const { status, ...restOfResponse } = await this.adminRolesService.updateRole(parseInt(id, 10), updateRoleDto);
    return res.status(status).json(restOfResponse);
  }

  @Delete(':id')
  @RequirePermission(PermissionName.ROLE_DELETE)
  async deleteRole(@Param('id') id: string, @Res() res: Response) {
    const { status, ...restOfResponse } = await this.adminRolesService.deleteRole(parseInt(id, 10));
    return res.status(status).json(restOfResponse);
  }

  @Get(':id/permissions')
  @RequirePermission(PermissionName.ROLE_READ)
  async getRolePermissions(@Param('id') id: string, @Res() res: Response) {
    const { status, ...restOfResponse } = await this.adminRolesService.getRolePermissions(parseInt(id, 10));
    return res.status(status).json(restOfResponse);
  }

  @Post(':id/permissions')
  @RequirePermission(PermissionName.ROLE_UPDATE)
  async assignPermissionToRole(
    @Param('id') id: string,
    @Body() assignPermissionDto: AssignPermissionDto,
    @Res() res: Response
  ) {
    const { status, ...restOfResponse } = await this.adminRolesService.assignPermissionToRole(parseInt(id, 10), assignPermissionDto);
    return res.status(status).json(restOfResponse);
  }

  @Delete(':id/permissions/:permissionId')
  @RequirePermission(PermissionName.ROLE_UPDATE)
  async removePermissionFromRole(
    @Param('id') id: string,
    @Param('permissionId') permissionId: string,
    @Res() res: Response
  ) {
    const { status, ...restOfResponse } = await this.adminRolesService.removePermissionFromRole(parseInt(id, 10), parseInt(permissionId, 10));
    return res.status(status).json(restOfResponse);
  }
} 