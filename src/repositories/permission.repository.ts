import { Injectable } from '@nestjs/common';
import { PermissionName, Prisma } from '@prisma/client';
import prisma from '../common/prisma';

@Injectable()
export class PermissionRepository {
  // Note: isActive, createdBy, updatedBy fields removed from Permission model
  async create(data: { name: PermissionName; description?: string }): Promise<any> {
    return prisma.permission.create({
      data: {
        name: data.name,
        description: data.description,
      },
    });
  }

  async findById(id: number): Promise<any | null> {
    return prisma.permission.findUnique({
      where: { id },
    });
  }

  async findByName(name: PermissionName): Promise<any | null> {
    return prisma.permission.findUnique({
      where: { name },
    });
  }

  async findAll(filter: { keyword?: string; offset: number; limit: number }): Promise<{ permissions: any[]; total: number }> {
    const { offset, limit, keyword } = filter;

    const whereClause = Prisma.sql`
      WHERE (
        P.name::text ILIKE CONCAT('%', ${keyword}::text, '%') 
        OR P.description::text ILIKE CONCAT('%', ${keyword}::text, '%')
        OR COALESCE(${keyword}, NULL) IS NULL
      )
    `;

    const retrievePermissionsQuery = Prisma.sql`
      SELECT 
        P.id,
        P.name,
        P.description,
        P.created_at as "createdAt",
        P.updated_at as "updatedAt"
      FROM permissions P
      ${whereClause} 
      ORDER BY P.created_at DESC 
      LIMIT ${limit} 
      OFFSET ${offset}
    `;

    const countPermissionsQuery = Prisma.sql`
      SELECT COUNT(*)::int 
      FROM permissions P
      ${whereClause}
    `;

    const permissions: any[] = await prisma.$queryRaw(retrievePermissionsQuery);
    const [{ count }]: { count: number }[] = await prisma.$queryRaw(countPermissionsQuery);

    return {
      permissions,
      total: count,
    };
  }

  async update(id: number, data: { name?: PermissionName; description?: string }): Promise<any> {
    return prisma.permission.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
      },
    });
  }

  async delete(id: number): Promise<void> {
    await prisma.permission.delete({
      where: { id },
    });
  }

  // Note: userPermission and userRole models don't exist in new schema
  // These methods return placeholder values
  async findUserPermissions(userId: number): Promise<string[]> {
    // User-permission relationship doesn't exist in new schema
    // Would need to be implemented differently
    return [];
  }

  async grantPermissionToUser(
    userId: number,
    permissionId: number
  ): Promise<void> {
    // User-permission relationship doesn't exist in new schema
    console.warn('grantPermissionToUser: Not implemented in new schema');
  }

  async revokePermissionFromUser(
    userId: number,
    permissionId: number
  ): Promise<void> {
    // User-permission relationship doesn't exist in new schema
    console.warn('revokePermissionFromUser: Not implemented in new schema');
  }

  // Check if user has specific permission
  async hasPermission(userId: number, permissionName: PermissionName): Promise<boolean> {
    // User-permission relationship doesn't exist in new schema
    // Would need to check user's role-based permissions
    return false;
  }

  // Check if user has any of the specified permissions
  async hasAnyPermission(userId: number, permissionNames: PermissionName[]): Promise<boolean> {
    // User-permission relationship doesn't exist in new schema
    return false;
  }

  // Check if user has all of the specified permissions
  async hasAllPermissions(userId: number, permissionNames: PermissionName[]): Promise<boolean> {
    // User-permission relationship doesn't exist in new schema
    return false;
  }
} 