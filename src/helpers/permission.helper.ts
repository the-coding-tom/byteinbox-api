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
  grantedBy?: number,
  expiresAt?: Date,
  reason?: string,
): Promise<void> {
  const permission = await permissionRepository.findByName(permissionName);
  if (!permission) {
    throw new Error(`Permission ${permissionName} not found`);
  }

  await permissionRepository.grantPermissionToUser(
    userId,
    permission.id,
    grantedBy,
    expiresAt,
    reason,
  );
}

/**
 * Revoke a permission from a user
 */
export async function revokePermissionFromUser(
  permissionRepository: PermissionRepository,
  userId: number,
  permissionName: PermissionName,
  reason?: string,
): Promise<void> {
  const permission = await permissionRepository.findByName(permissionName);
  if (!permission) {
    throw new Error(`Permission ${permissionName} not found`);
  }

  await permissionRepository.revokePermissionFromUser(
    userId,
    permission.id,
    reason,
  );
}

/**
 * Assign a role to a user
 */
export async function assignRoleToUser(
  roleRepository: RoleRepository,
  userId: number,
  roleName: RoleName,
  assignedBy?: number,
): Promise<void> {
  const role = await roleRepository.findByName(roleName);
  if (!role) {
    throw new Error(`Role ${roleName} not found`);
  }

  await roleRepository.assignRoleToUser(userId, role.id, assignedBy);
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

  await roleRepository.assignPermissionToRole(role.id, permission.id, assignedBy);
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
 */
export async function initializeDefaultRolesAndPermissions(
  roleRepository: RoleRepository,
  permissionRepository: PermissionRepository
): Promise<void> {
  // Create default roles
  const defaultRoles = [
    { name: RoleName.USER_MANAGER, description: 'Can manage user accounts' },
    { name: RoleName.SECURITY_ADMIN, description: 'Can manage security settings and blacklists' },
    { name: RoleName.CONTENT_MODERATOR, description: 'Can moderate content' },
    { name: RoleName.SUPPORT_AGENT, description: 'Can provide customer support' },
    { name: RoleName.SYSTEM_ADMIN, description: 'Can manage system settings' },
    { name: RoleName.FINANCE_ADMIN, description: 'Can manage financial operations' },
    { name: RoleName.AUDIT_ADMIN, description: 'Can view audit logs and reports' },
  ];

  for (const roleData of defaultRoles) {
    const existingRole = await roleRepository.findByName(roleData.name);
    if (!existingRole) {
      await roleRepository.create(roleData);
    }
  }

  // Create default permissions
  const defaultPermissions = [
    // User Management
    { name: PermissionName.VIEW_USERS, description: 'Can view user accounts' },
    { name: PermissionName.CREATE_USERS, description: 'Can create new user accounts' },
    { name: PermissionName.UPDATE_USERS, description: 'Can update user account information' },
    { name: PermissionName.DELETE_USERS, description: 'Can delete user accounts' },
    { name: PermissionName.RESET_USER_MFA, description: 'Can reset user MFA settings' },
    { name: PermissionName.UNLOCK_USER_ACCOUNT, description: 'Can unlock user accounts' },

    // Security Management
    { name: PermissionName.VIEW_BLACKLIST, description: 'Can view blacklist entries' },
    { name: PermissionName.MANAGE_BLACKLIST, description: 'Can manage blacklist entries' },
    { name: PermissionName.VIEW_AUDIT_LOGS, description: 'Can view audit logs' },
    { name: PermissionName.MANAGE_SECURITY_SETTINGS, description: 'Can manage security settings' },

    // Content Management
    { name: PermissionName.MODERATE_CONTENT, description: 'Can moderate content' },
    { name: PermissionName.APPROVE_CONTENT, description: 'Can approve content' },
    { name: PermissionName.DELETE_CONTENT, description: 'Can delete content' },

    // System Management
    { name: PermissionName.MANAGE_SYSTEM_SETTINGS, description: 'Can manage system settings' },
    { name: PermissionName.VIEW_SYSTEM_LOGS, description: 'Can view system logs' },
    { name: PermissionName.MANAGE_EMAIL_TEMPLATES, description: 'Can manage email templates' },

    // Financial Management
    { name: PermissionName.VIEW_FINANCIAL_DATA, description: 'Can view financial data' },
    { name: PermissionName.MANAGE_PAYMENTS, description: 'Can manage payments' },
    { name: PermissionName.VIEW_TRANSACTION_LOGS, description: 'Can view transaction logs' },

    // Audit and Compliance
    { name: PermissionName.VIEW_AUDIT_TRAILS, description: 'Can view audit trails' },
    { name: PermissionName.EXPORT_AUDIT_DATA, description: 'Can export audit data' },
    { name: PermissionName.MANAGE_COMPLIANCE_REPORTS, description: 'Can manage compliance reports' },
  ];

  for (const permissionData of defaultPermissions) {
    const existingPermission = await permissionRepository.findByName(permissionData.name);
    if (!existingPermission) {
      await permissionRepository.create(permissionData);
    }
  }

  // Assign default permissions to roles
  await assignDefaultPermissionsToRoles(roleRepository, permissionRepository);
}

/**
 * Assign default permissions to roles
 */
async function assignDefaultPermissionsToRoles(
  roleRepository: RoleRepository,
  permissionRepository: PermissionRepository
): Promise<void> {
  // User Manager permissions
  await assignRolePermissions(roleRepository, permissionRepository, RoleName.USER_MANAGER, [
    PermissionName.VIEW_USERS,
    PermissionName.CREATE_USERS,
    PermissionName.UPDATE_USERS,
    PermissionName.RESET_USER_MFA,
    PermissionName.UNLOCK_USER_ACCOUNT,
  ]);

  // Security Admin permissions
  await assignRolePermissions(roleRepository, permissionRepository, RoleName.SECURITY_ADMIN, [
    PermissionName.VIEW_BLACKLIST,
    PermissionName.MANAGE_BLACKLIST,
    PermissionName.VIEW_AUDIT_LOGS,
    PermissionName.MANAGE_SECURITY_SETTINGS,
  ]);

  // Content Moderator permissions
  await assignRolePermissions(roleRepository, permissionRepository, RoleName.CONTENT_MODERATOR, [
    PermissionName.MODERATE_CONTENT,
    PermissionName.APPROVE_CONTENT,
    PermissionName.DELETE_CONTENT,
  ]);

  // Support Agent permissions
  await assignRolePermissions(roleRepository, permissionRepository, RoleName.SUPPORT_AGENT, [
    PermissionName.VIEW_USERS,
    PermissionName.UPDATE_USERS,
    PermissionName.RESET_USER_MFA,
    PermissionName.UNLOCK_USER_ACCOUNT,
  ]);

  // System Admin permissions
  await assignRolePermissions(roleRepository, permissionRepository, RoleName.SYSTEM_ADMIN, [
    PermissionName.MANAGE_SYSTEM_SETTINGS,
    PermissionName.VIEW_SYSTEM_LOGS,
    PermissionName.MANAGE_EMAIL_TEMPLATES,
    PermissionName.VIEW_AUDIT_LOGS,
  ]);

  // Finance Admin permissions
  await assignRolePermissions(roleRepository, permissionRepository, RoleName.FINANCE_ADMIN, [
    PermissionName.VIEW_FINANCIAL_DATA,
    PermissionName.MANAGE_PAYMENTS,
    PermissionName.VIEW_TRANSACTION_LOGS,
  ]);

  // Audit Admin permissions
  await assignRolePermissions(roleRepository, permissionRepository, RoleName.AUDIT_ADMIN, [
    PermissionName.VIEW_AUDIT_TRAILS,
    PermissionName.EXPORT_AUDIT_DATA,
    PermissionName.VIEW_AUDIT_LOGS,
  ]);
}

/**
 * Assign permissions to a role
 */
async function assignRolePermissions(
  roleRepository: RoleRepository,
  permissionRepository: PermissionRepository,
  roleName: RoleName, 
  permissionNames: PermissionName[]
): Promise<void> {
  for (const permissionName of permissionNames) {
    try {
      await assignPermissionToRole(roleRepository, permissionRepository, roleName, permissionName);
    } catch (error) {
      // Skip if permission is already assigned
      console.log(`Permission ${permissionName} already assigned to role ${roleName}`);
    }
  }
} 