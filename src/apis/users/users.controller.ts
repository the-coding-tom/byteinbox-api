import { Controller, Post, Get, Put, Delete, Body, Query, Param, Req, Res } from '@nestjs/common';
import { Response } from 'express';

import { API_PATHS } from '../../common/constants/validation.constant';

import { CreateUserDto, UpdateUserDto, UserFilterDto } from './dto/users.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async createUser(@Body() body: CreateUserDto, @Req() req: any, @Res() res: Response) {
    const { status, ...restOfResponse } = await this.usersService.createUser(body);
    return res.status(status).json(restOfResponse);
  }

  @Get()
  async getUsers(@Query() filter: UserFilterDto, @Res() res: Response) {
    const { status, ...restOfResponse } = await this.usersService.getUsers(filter);
    return res.status(status).json(restOfResponse);
  }

  @Get(':id')
  async getUserById(@Param('id') id: string, @Res() res: Response) {
    const { status, ...restOfResponse } = await this.usersService.getUserById(id);
    return res.status(status).json(restOfResponse);
  }

  @Put(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() body: Omit<UpdateUserDto, 'id'>,
    @Res() res: Response,
  ) {
    const updateData = { ...body, id: parseInt(id) };
    const { status, ...restOfResponse } = await this.usersService.updateUser(updateData);
    return res.status(status).json(restOfResponse);
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string, @Res() res: Response) {
    const { status, ...restOfResponse } = await this.usersService.deleteUser(id);
    return res.status(status).json(restOfResponse);
  }
}
