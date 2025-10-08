import { PermissionName, RoleName } from '@prisma/client';
import { RoleRepository } from '../repositories/role.repository';
import { PermissionRepository } from '../repositories/permission.repository';

/**
 * Check if a user has a specific permission
 */
export async function hasPermission(
  permissionRepository: PermissionRepository,
  userId: number,
  permissionName: PermissionName
): Promise<boolean> {
  return permissionRepository.hasPermission(userId, permissionName);
}

/**
 * Check if a user has any of the specified permissions
 */
export async function hasAnyPermission(
  permissionRepository: PermissionRepository,
  userId: number,
  permissionNames: PermissionName[]
): Promise<boolean> {
  return permissionRepository.hasAnyPermission(userId, permissionNames);
}

/**
 * Check if a user has all of the specified permissions
 */
export async function hasAllPermissions(
  permissionRepository: PermissionRepository,
  userId: number,
  permissionNames: PermissionName[]
): Promise<boolean> {
  return permissionRepository.hasAllPermissions(userId, permissionNames);
}

/**
 * Get all permissions for a user (from both direct assignments and roles)
 */
export async function getUserPermissions(
  permissionRepository: PermissionRepository,
  userId: number
): Promise<string[]> {
  return permissionRepository.findUserPermissions(userId);
}

/**
 * Get all roles for a user
 */
export async function getUserRoles(
  roleRepository: RoleRepository,
  userId: number
): Promise<RoleName[]> {
  const roles = await roleRepository.findUserRoles(userId);
  return roles.map(role => role.name);
}

/**
 * Grant a permission directly to a user
 */
export async function grantPermissionToUser(
  permissionRepository: PermissionRepository,
  userId: number,
  permissionName: PermissionName,
): Promise<void> {
  const permission = await permissionRepository.findByName(permissionName);
  if (!permission) {
    throw new Error(`Permission ${permissionName} not found`);
  }

  await permissionRepository.grantPermissionToUser(
    userId,
    permission.id,
  );
}

/**
 * Revoke a permission from a user
 */
export async function revokePermissionFromUser(
  permissionRepository: PermissionRepository,
  userId: number,
  permissionName: PermissionName,
): Promise<void> {
  const permission = await permissionRepository.findByName(permissionName);
  if (!permission) {
    throw new Error(`Permission ${permissionName} not found`);
  }

  await permissionRepository.revokePermissionFromUser(
    userId,
    permission.id,
  );
}

/**
 * Assign a role to a user
 */
export async function assignRoleToUser(
  roleRepository: RoleRepository,
  userId: number,
  roleName: RoleName,
): Promise<void> {
  const role = await roleRepository.findByName(roleName);
  if (!role) {
    throw new Error(`Role ${roleName} not found`);
  }

  await roleRepository.assignRoleToUser(userId, role.id);
}

/**
 * Remove a role from a user
 */
export async function removeRoleFromUser(
  roleRepository: RoleRepository,
  userId: number,
  roleName: RoleName
): Promise<void> {
  const role = await roleRepository.findByName(roleName);
  if (!role) {
    throw new Error(`Role ${roleName} not found`);
  }

  await roleRepository.removeRoleFromUser(userId, role.id);
}

/**
 * Assign a permission to a role
 */
export async function assignPermissionToRole(
  roleRepository: RoleRepository,
  permissionRepository: PermissionRepository,
  roleName: RoleName,
  permissionName: PermissionName,
  assignedBy?: number,
): Promise<void> {
  const [role, permission] = await Promise.all([
    roleRepository.findByName(roleName),
    permissionRepository.findByName(permissionName),
  ]);

  if (!role) {
    throw new Error(`Role ${roleName} not found`);
  }
  if (!permission) {
    throw new Error(`Permission ${permissionName} not found`);
  }

  await roleRepository.assignPermissionToRole(role.id, permission.id);
}

/**
 * Remove a permission from a role
 */
export async function removePermissionFromRole(
  roleRepository: RoleRepository,
  permissionRepository: PermissionRepository,
  roleName: RoleName, 
  permissionName: PermissionName
): Promise<void> {
  const [role, permission] = await Promise.all([
    roleRepository.findByName(roleName),
    permissionRepository.findByName(permissionName),
  ]);

  if (!role) {
    throw new Error(`Role ${roleName} not found`);
  }
  if (!permission) {
    throw new Error(`Permission ${permissionName} not found`);
  }

  await roleRepository.removePermissionFromRole(role.id, permission.id);
}

/**
 * Get all permissions for a role
 */
export async function getRolePermissions(
  roleRepository: RoleRepository,
  roleName: RoleName
): Promise<string[]> {
  const role = await roleRepository.findByName(roleName);
  if (!role) {
    throw new Error(`Role ${roleName} not found`);
  }

  return roleRepository.findRolePermissions(role.id);
}

/**
 * Initialize default roles and permissions
 * @deprecated This function uses old enum values. Use src/seeds/data/roles-permissions.ts instead
 */
export async function initializeDefaultRolesAndPermissions(
  roleRepository: RoleRepository,
  permissionRepository: PermissionRepository
): Promise<void> {
  console.warn('⚠️  initializeDefaultRolesAndPermissions is deprecated.');
  console.warn('   Use src/seeds/data/roles-permissions.ts for seeding instead.');
  // Deprecated - seeding now handled by src/seeds/data/roles-permissions.ts
}
 