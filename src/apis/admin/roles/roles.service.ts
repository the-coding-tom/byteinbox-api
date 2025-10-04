import { Injectable, HttpStatus } from '@nestjs/common';
import { RoleRepository } from '../../../repositories/role.repository';
import { PermissionRepository } from '../../../repositories/permission.repository';
import { AdminRolesValidator } from './roles.validator';
import { generateSuccessResponse } from '../../../utils/util';
import { handleServiceError } from '../../../utils/error.util';
import { CreateRoleDto, UpdateRoleDto, AssignPermissionDto } from './dto/roles.dto';

@Injectable()
export class AdminRolesService {
  constructor(
    private roleRepository: RoleRepository,
    private permissionRepository: PermissionRepository,
    private adminRolesValidator: AdminRolesValidator,
  ) {}

  async getRoles(query: any): Promise<{ status: number; message: string; data: any }> {
    try {
      const validatedQuery = await this.adminRolesValidator.validateGetRoles(query);
      
      const result = await this.roleRepository.findAll(validatedQuery);
      
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'Success',
        data: {
          roles: result.roles,
          pagination: {
            total: result.total,
            offset: validatedQuery.offset,
            limit: validatedQuery.limit,
          },
        },
      });
    } catch (error) {
      return handleServiceError('Error retrieving roles', error);
    }
  }

  async createRole(createRoleDto: CreateRoleDto): Promise<{ status: number; message: string; data: any }> {
    try {
      const validatedData = await this.adminRolesValidator.validateCreateRole(createRoleDto);
      
      const role = await this.roleRepository.create(validatedData);
      
      return generateSuccessResponse({
        statusCode: HttpStatus.CREATED,
        message: 'Success',
        data: role,
      });
    } catch (error) {
      return handleServiceError('Error creating role', error);
    }
  }

  async getRole(id: number): Promise<{ status: number; message: string; data: any }> {
    try {
      const validatedId = await this.adminRolesValidator.validateRoleExists(id);
      const role = await this.roleRepository.findById(validatedId);
      
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'Success',
        data: role,
      });
    } catch (error) {
      return handleServiceError('Error retrieving role', error);
    }
  }

  async updateRole(id: number, updateRoleDto: UpdateRoleDto): Promise<{ status: number; message: string; data: any }> {
    try {
      const validatedId = await this.adminRolesValidator.validateRoleExists(id);
      const validatedData = await this.adminRolesValidator.validateUpdateRole(updateRoleDto);
      
      const role = await this.roleRepository.update(validatedId, validatedData);
      
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'Success',
        data: role,
      });
    } catch (error) {
      return handleServiceError('Error updating role', error);
    }
  }

  async deleteRole(id: number): Promise<{ status: number; message: string }> {
    try {
      const validatedId = await this.adminRolesValidator.validateRoleExists(id);
      await this.roleRepository.delete(validatedId);
      
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'Role deleted successfully',
      });
    } catch (error) {
      return handleServiceError('Error deleting role', error);
    }
  }

  async getRolePermissions(id: number): Promise<{ status: number; message: string; data: any }> {
    try {
      const validatedId = await this.adminRolesValidator.validateRoleExists(id);
      const role = await this.roleRepository.findById(validatedId);
      const permissions = await this.roleRepository.findRolePermissions(role!.name);
      
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'Success',
        data: {
          role,
          permissions,
        },
      });
    } catch (error) {
      return handleServiceError('Error getting role permissions', error);
    }
  }

  async assignPermissionToRole(id: number, assignPermissionDto: AssignPermissionDto): Promise<{ status: number; message: string; data: any }> {
    try {
      const validatedId = await this.adminRolesValidator.validateRoleExists(id);
      const validatedData = await this.adminRolesValidator.validateAssignPermission(assignPermissionDto);
      
      const role = await this.roleRepository.findById(validatedId);
      await this.roleRepository.assignPermissionToRole(
        role!.name,
        validatedData.permissionName,
      );
      
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'Permission assigned successfully',
        data: { roleId: validatedId, permissionName: validatedData.permissionName },
      });
    } catch (error) {
      return handleServiceError('Error assigning permission to role', error);
    }
  }

  async removePermissionFromRole(id: number, permissionId: number): Promise<{ status: number; message: string; data: any }> {
    try {
      const validatedId = await this.adminRolesValidator.validateRoleExists(id);
      const validatedPermissionId = await this.adminRolesValidator.validatePermissionExists(permissionId);
      
      const role = await this.roleRepository.findById(validatedId);
      const permission = await this.permissionRepository.findById(validatedPermissionId);
      
      await this.roleRepository.removePermissionFromRole(role!.name, permission!.name);
      
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'Permission removed successfully',
        data: { roleId: validatedId, permissionId: validatedPermissionId },
      });
    } catch (error) {
      return handleServiceError('Error removing permission from role', error);
    }
  }

  async getUserRoles(userId: number): Promise<{ status: number; message: string; data: any }> {
    try {
      const validatedUserId = await this.adminRolesValidator.validateUserId(userId);
      const roles = await this.roleRepository.findUserRoles(validatedUserId);
      
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'Success',
        data: roles,
      });
    } catch (error) {
      return handleServiceError('Error getting user roles', error);
    }
  }

  async getUserPermissions(userId: number): Promise<{ status: number; message: string; data: any }> {
    try {
      const validatedUserId = await this.adminRolesValidator.validateUserId(userId);
      const permissions = await this.permissionRepository.findUserPermissions(validatedUserId);
      
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'Success',
        data: permissions,
      });
    } catch (error) {
      return handleServiceError('Error getting user permissions', error);
    }
  }

  async assignRoleToUser(userId: number, assignRoleDto: any): Promise<{ status: number; message: string; data: any }> {
    try {
      const validatedUserId = await this.adminRolesValidator.validateUserId(userId);
      const validatedData = await this.adminRolesValidator.validateAssignRole(assignRoleDto);
      
      await this.roleRepository.assignRoleToUser(validatedUserId, validatedData.roleId);
      
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'Role assigned successfully',
        data: { userId: validatedUserId, roleId: validatedData.roleId },
      });
    } catch (error) {
      return handleServiceError('Error assigning role to user', error);
    }
  }

  async removeRoleFromUser(userId: number, roleId: number): Promise<{ status: number; message: string; data: any }> {
    try {
      const validatedUserId = await this.adminRolesValidator.validateUserId(userId);
      await this.roleRepository.removeRoleFromUser(validatedUserId, roleId);
      
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'Role removed successfully',
        data: { userId: validatedUserId, roleId },
      });
    } catch (error) {
      return handleServiceError('Error removing role from user', error);
    }
  }
} 