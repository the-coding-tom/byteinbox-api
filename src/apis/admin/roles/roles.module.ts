import { Module } from '@nestjs/common';
import { AdminRolesController } from './roles.controller';
import { AdminRolesService } from './roles.service';
import { AdminRolesValidator } from './roles.validator';
import { RoleRepository } from '../../../repositories/role.repository';
import { PermissionRepository } from '../../../repositories/permission.repository';
import { UserRepository } from '../../../repositories/user.repository';

@Module({
  controllers: [AdminRolesController],
  providers: [
    AdminRolesService,
    AdminRolesValidator,
    RoleRepository,
    PermissionRepository,
    UserRepository,
  ],
  exports: [AdminRolesService],
})
export class AdminRolesModule {} 