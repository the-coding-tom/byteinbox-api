import { RoleName, PermissionName } from '@prisma/client';

// Request DTOs
export class GetRolesDto {
  offset?: number;
  limit?: number;
  keyword?: string;
  isActive?: boolean;
}

export class CreateRoleDto {
  name: RoleName;
  description?: string;
  isActive?: boolean;
  createdBy?: number;
}

export class UpdateRoleDto {
  name?: RoleName;
  description?: string;
  isActive?: boolean;
  updatedBy?: number;
}

export class AssignPermissionDto {
  permissionName: PermissionName;
}

export class AssignRoleDto {
  roleName: RoleName;
}

export class GrantPermissionDto {
  permissionName: PermissionName;
}

// Response DTOs
export class RoleResponseDto {
  id: number;
  name: RoleName;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: number;
  updatedBy?: number;
  _count?: {
    rolePermissions: number;
    userRoles: number;
  };
}

export class PermissionResponseDto {
  id: number;
  name: PermissionName;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class RolesListResponse {
  roles: RoleResponseDto[];
  pagination: {
    total: number;
    offset: number;
    limit: number;
  };
}

export class RolePermissionsResponse {
  role: RoleResponseDto;
  permissions: PermissionResponseDto[];
}

export class AdminRolesResponse {
  message: string;
  data: RoleResponseDto;
}

export class AdminRolesListResponse {
  message: string;
  data: RolesListResponse;
}

export class AdminRolePermissionsResponse {
  message: string;
  data: RolePermissionsResponse;
} 