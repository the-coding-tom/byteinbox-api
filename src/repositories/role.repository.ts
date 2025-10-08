import { Injectable } from '@nestjs/common';
import { RoleName } from '@prisma/client';
import prisma from '../common/prisma';

@Injectable()
export class RoleRepository {
  // Note: isActive, createdBy, updatedBy fields removed from Role model
  async create(data: { name: RoleName; description?: string }): Promise<any> {
    return prisma.role.create({
      data: {
        name: data.name,
        description: data.description,
      },
    });
  }

  async findById(id: number): Promise<any | null> {
    return prisma.role.findUnique({
      where: { id },
    });
  }

  async findByName(name: RoleName): Promise<any | null> {
    return prisma.role.findUnique({
      where: { name },
    });
  }

  async findAll(filter: { keyword?: string; offset: number; limit: number }): Promise<{ roles: any[]; total: number }> {
    const where: any = {};
    
    if (filter.keyword) {
      where.OR = [
        { description: { contains: filter.keyword, mode: 'insensitive' } },
      ];
    }

    const [roles, total] = await Promise.all([
      prisma.role.findMany({
        where,
        skip: filter.offset,
        take: filter.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.role.count({ where }),
    ]);

    return {
      roles,
      total,
    };
  }

  async update(id: number, data: { name?: RoleName; description?: string }): Promise<any> {
    return prisma.role.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
      },
    });
  }

  async delete(id: number): Promise<void> {
    await prisma.role.delete({
      where: { id },
    });
  }

  // Note: userRole model doesn't exist in new schema
  // User-role relationships would need to be managed differently
  async findUserRoles(userId: number): Promise<any[]> {
    // This functionality needs to be implemented differently in new schema
    // For now, returning empty array
    return [];
  }

  async assignRoleToUser(userId: number, roleId: number): Promise<void> {
    // This functionality needs to be implemented differently in new schema
    // User-role relationship doesn't exist in current schema
    console.warn('assignRoleToUser: User-role relationship not implemented in new schema');
  }

  async removeRoleFromUser(userId: number, roleId: number): Promise<void> {
    // This functionality needs to be implemented differently in new schema
    console.warn('removeRoleFromUser: User-role relationship not implemented in new schema');
  }

  async findRolePermissions(roleId: number): Promise<string[]> {
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { roleId },
      include: { permission: true },
    });

    return rolePermissions.map(rp => rp.permission.name);
  }

  async assignPermissionToRole(roleId: number, permissionId: number): Promise<void> {
    await prisma.rolePermission.create({
      data: {
        roleId,
        permissionId,
      },
    });
  }

  async removePermissionFromRole(roleId: number, permissionId: number): Promise<void> {
    await prisma.rolePermission.delete({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });
  }
} 