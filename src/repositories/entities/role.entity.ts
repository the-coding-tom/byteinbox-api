import { RoleName } from '@prisma/client';

export class CreateRoleData {
  name: RoleName;
  description?: string;
  isActive?: boolean;
  createdBy?: number;
}

export class UpdateRoleData {
  name?: RoleName;
  description?: string;
  isActive?: boolean;
  updatedBy?: number;
}

export class RoleFilter {
  offset: number;
  limit: number;
  keyword?: string;
  isActive?: boolean;
}

export class RoleEntity {
  id: number;
  name: RoleName;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: number | null;
  updatedBy: number | null;
} 