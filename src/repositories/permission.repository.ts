import { Injectable } from '@nestjs/common';
import { PermissionName, Prisma } from '@prisma/client';
import prisma from '../common/prisma';

@Injectable()
export class PermissionRepository {
  async create(data: { name: PermissionName; description: string; isActive?: boolean; createdBy?: number }): Promise<any> {
    return prisma.permission.create({
      data: {
        name: data.name,
        description: data.description,
        isActive: data.isActive ?? true,
        createdBy: data.createdBy,
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

  async findAll(filter: { isActive?: boolean; keyword?: string; offset: number; limit: number }): Promise<{ permissions: any[]; total: number }> {
    const { offset, limit, keyword, isActive } = filter;

    const whereClause = Prisma.sql`
      WHERE (
        P.name::text ILIKE CONCAT('%', ${keyword}::text, '%') 
        OR P.description::text ILIKE CONCAT('%', ${keyword}::text, '%')
        OR COALESCE(${keyword}, NULL) IS NULL
      )
      AND (P.is_active = ${isActive}::boolean OR COALESCE(${isActive}, NULL) IS NULL)
    `;

    const retrievePermissionsQuery = Prisma.sql`
      SELECT 
        P.id,
        P.name,
        P.description,
        P.is_active as "isActive",
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

  async update(id: number, data: { name?: PermissionName; description?: string; isActive?: boolean; updatedBy?: number }): Promise<any> {
    return prisma.permission.update({
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
    await prisma.permission.delete({
      where: { id },
    });
  }

  // Single query to get all user permissions (direct + role-based)
  async findUserPermissions(userId: number): Promise<string[]> {
    const result = await prisma.$queryRaw<{ permission_name: string }[]>`
      SELECT DISTINCT p.name as permission_name
      FROM permissions p
      WHERE p.is_active = true
      AND (
        -- Direct user permissions
        EXISTS (
          SELECT 1 FROM user_permissions up 
          WHERE up.user_id = ${userId} 
          AND up.permission_id = p.id 
          AND up.granted = true
          AND (up.expires_at IS NULL OR up.expires_at > NOW())
        )
        OR
        -- Role-based permissions
        EXISTS (
          SELECT 1 FROM user_roles ur
          JOIN role_permissions rp ON ur.role_id = rp.role_id
          WHERE ur.user_id = ${userId}
          AND rp.permission_id = p.id
        )
      )
    `;

    return result.map(row => row.permission_name);
  }

  async grantPermissionToUser(
    userId: number, 
    permissionId: number, 
    grantedBy?: number,
    expiresAt?: Date,
    reason?: string
  ): Promise<void> {
    await prisma.userPermission.upsert({
      where: {
        userId_permissionId: {
          userId,
          permissionId,
        },
      },
      update: {
        granted: true,
        grantedAt: new Date(),
        grantedBy,
        expiresAt,
        reason,
      },
      create: {
        userId,
        permissionId,
        granted: true,
        grantedBy,
        expiresAt,
        reason,
      },
    });
  }

  async revokePermissionFromUser(
    userId: number, 
    permissionId: number,
    reason?: string
  ): Promise<void> {
    await prisma.userPermission.update({
      where: {
        userId_permissionId: {
          userId,
          permissionId,
        },
      },
      data: {
        granted: false,
        reason,
      },
    });
  }

  // Single query to check if user has specific permission
  async hasPermission(userId: number, permissionName: PermissionName): Promise<boolean> {
    const result = await prisma.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT 1 FROM permissions p
        WHERE p.name = ${permissionName}
        AND p.is_active = true
        AND (
          -- Direct user permissions
          EXISTS (
            SELECT 1 FROM user_permissions up 
            WHERE up.user_id = ${userId} 
            AND up.permission_id = p.id 
            AND up.granted = true
            AND (up.expires_at IS NULL OR up.expires_at > NOW())
          )
          OR
          -- Role-based permissions
          EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN role_permissions rp ON ur.role_id = rp.role_id
            WHERE ur.user_id = ${userId}
            AND rp.permission_id = p.id
          )
        )
      ) as exists
    `;

    return result[0]?.exists || false;
  }

  // Single query to check if user has any of the specified permissions
  async hasAnyPermission(userId: number, permissionNames: PermissionName[]): Promise<boolean> {
    if (permissionNames.length === 0) return false;

    const result = await prisma.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT 1 FROM permissions p
        WHERE p.name = ANY(${permissionNames})
        AND p.is_active = true
        AND (
          -- Direct user permissions
          EXISTS (
            SELECT 1 FROM user_permissions up 
            WHERE up.user_id = ${userId} 
            AND up.permission_id = p.id 
            AND up.granted = true
            AND (up.expires_at IS NULL OR up.expires_at > NOW())
          )
          OR
          -- Role-based permissions
          EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN role_permissions rp ON ur.role_id = rp.role_id
            WHERE ur.user_id = ${userId}
            AND rp.permission_id = p.id
          )
        )
      ) as exists
    `;

    return result[0]?.exists || false;
  }

  // Single query to check if user has all of the specified permissions
  async hasAllPermissions(userId: number, permissionNames: PermissionName[]): Promise<boolean> {
    if (permissionNames.length === 0) return true;

    const result = await prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(DISTINCT p.name) as count
      FROM permissions p
      WHERE p.name = ANY(${permissionNames})
      AND p.is_active = true
      AND (
        -- Direct user permissions
        EXISTS (
          SELECT 1 FROM user_permissions up 
          WHERE up.user_id = ${userId} 
          AND up.permission_id = p.id 
          AND up.granted = true
          AND (up.expires_at IS NULL OR up.expires_at > NOW())
        )
        OR
        -- Role-based permissions
        EXISTS (
          SELECT 1 FROM user_roles ur
          JOIN role_permissions rp ON ur.role_id = rp.role_id
          WHERE ur.user_id = ${userId}
          AND rp.permission_id = p.id
        )
      )
    `;

    return result[0]?.count === permissionNames.length;
  }
} 