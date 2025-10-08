import { Controller, Post, Get, Put, Delete, Body, Query, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { AdminUsersService } from './users.service';
import {
  CreateUserByAdminDto,
  UpdateUserByAdminDto,
  AdminUserFilterDto,
  DeactivateUserAccountDto,
  DeleteUserAccountDto,
} from './dto/users.dto';

@Controller('api/v1/admin/users')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Post()
  async createUser(@Body() createUserDto: CreateUserByAdminDto, @Res() res: Response) {
    const { status, ...restOfResponse } = await this.adminUsersService.createUserByAdmin(createUserDto);
    return res.status(status).json(restOfResponse);
  }

  @Get()
  async getUsers(@Query() filter: AdminUserFilterDto, @Res() res: Response) {
    const { status, ...restOfResponse } = await this.adminUsersService.getUsers(filter);
    return res.status(status).json(restOfResponse);
  }

  @Get(':id')
  async getUserById(@Param('id') id: string, @Res() res: Response) {
    const { status, ...restOfResponse } = await this.adminUsersService.getUserById(id);
    return res.status(status).json(restOfResponse);
  }

  @Put(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: Omit<UpdateUserByAdminDto, 'id'>,
    @Res() res: Response,
  ) {
    const updateData = { ...updateUserDto, id: parseInt(id) };
    const { status, ...restOfResponse } = await this.adminUsersService.updateUserByAdmin(updateData);
    return res.status(status).json(restOfResponse);
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string, @Res() res: Response) {
    const { status, ...restOfResponse } = await this.adminUsersService.deleteUser(id);
    return res.status(status).json(restOfResponse);
  }

  @Post('deactivate-account')
  async deactivateUserAccount(@Body() deactivateDto: DeactivateUserAccountDto, @Res() res: Response) {
    const { status, ...restOfResponse } = await this.adminUsersService.deactivateUserAccount(deactivateDto);
    return res.status(status).json(restOfResponse);
  }

  @Post('delete-account')
  async deleteUserAccount(@Body() deleteDto: DeleteUserAccountDto, @Res() res: Response) {
    const { status, ...restOfResponse } = await this.adminUsersService.deleteUserAccount(deleteDto);
    return res.status(status).json(restOfResponse);
  }
} 