import { PermissionName } from '@prisma/client';

export class CreatePermissionData {
  name: PermissionName;
  description?: string;
  isActive?: boolean;
  createdBy?: number;
}

export class UpdatePermissionData {
  name?: PermissionName;
  description?: string;
  isActive?: boolean;
  updatedBy?: number;
}

export class PermissionFilter {
  offset: number;
  limit: number;
  keyword?: string;
  isActive?: boolean;
}

export class PermissionEntity {
  id: number;
  name: PermissionName;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: number | null;
  updatedBy: number | null;
} 