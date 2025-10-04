import { Injectable } from '@nestjs/common';
import { RoleName } from '@prisma/client';
import prisma from '../common/prisma';

@Injectable()
export class RoleRepository {
  async create(data: { name: RoleName; description: string; isActive?: boolean; createdBy?: number }): Promise<any> {
    return prisma.role.create({
      data: {
        name: data.name,
        description: data.description,
        isActive: data.isActive ?? true,
        createdBy: data.createdBy,
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

  async findAll(filter: { isActive?: boolean; keyword?: string; offset: number; limit: number }): Promise<{ roles: any[]; total: number }> {
    const where: any = {};
    
    if (filter.isActive !== undefined) {
      where.isActive = filter.isActive;
    }
    
    if (filter.keyword) {
      where.OR = [
        { name: { contains: filter.keyword, mode: 'insensitive' } },
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

  async update(id: number, data: { name?: RoleName; description?: string; isActive?: boolean; updatedBy?: number }): Promise<any> {
    return prisma.role.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        isActive: data.isActive,
        updatedBy: data.updatedBy,
      },
    });
  }

  async delete(id: number): Promise<void> {
    await prisma.role.delete({
      where: { id },
    });
  }

  async findUserRoles(userId: number): Promise<any[]> {
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });

    return userRoles.map(userRole => userRole.role);
  }

  async assignRoleToUser(userId: number, roleId: number, createdBy?: number): Promise<void> {
    await prisma.userRole.create({
      data: {
        userId,
        roleId,
        createdBy,
      },
    });
  }

  async removeRoleFromUser(userId: number, roleId: number): Promise<void> {
    await prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });
  }

  async findRolePermissions(roleId: number): Promise<string[]> {
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { roleId },
      include: { permission: true },
    });

    return rolePermissions.map(rp => rp.permission.name);
  }

  async assignPermissionToRole(roleId: number, permissionId: number, createdBy?: number): Promise<void> {
    await prisma.rolePermission.create({
      data: {
        roleId,
        permissionId,
        createdBy,
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