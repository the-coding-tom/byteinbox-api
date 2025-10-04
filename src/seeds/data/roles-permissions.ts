import { PrismaClient, RoleName, PermissionName } from '@prisma/client';

export async function seedRolesAndPermissions(prisma: PrismaClient) {
  console.log('📝 Seeding roles and permissions...');

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
    const existingRole = await prisma.role.findUnique({
      where: { name: roleData.name },
    });
    
    if (!existingRole) {
      await prisma.role.create({ data: roleData });
      console.log(`✅ Created role: ${roleData.name}`);
    } else {
      console.log(`ℹ️  Role already exists: ${roleData.name}`);
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
    const existingPermission = await prisma.permission.findUnique({
      where: { name: permissionData.name },
    });
    
    if (!existingPermission) {
      await prisma.permission.create({ data: permissionData });
      console.log(`✅ Created permission: ${permissionData.name}`);
    } else {
      console.log(`ℹ️  Permission already exists: ${permissionData.name}`);
    }
  }

  // Assign default permissions to roles
  await assignDefaultPermissionsToRoles(prisma);
}

async function assignDefaultPermissionsToRoles(prisma: PrismaClient) {
  // User Manager permissions
  await assignRolePermissions(prisma, RoleName.USER_MANAGER, [
    PermissionName.VIEW_USERS,
    PermissionName.CREATE_USERS,
    PermissionName.UPDATE_USERS,
    PermissionName.RESET_USER_MFA,
    PermissionName.UNLOCK_USER_ACCOUNT,
  ]);

  // Security Admin permissions
  await assignRolePermissions(prisma, RoleName.SECURITY_ADMIN, [
    PermissionName.VIEW_BLACKLIST,
    PermissionName.MANAGE_BLACKLIST,
    PermissionName.VIEW_AUDIT_LOGS,
    PermissionName.MANAGE_SECURITY_SETTINGS,
  ]);

  // Content Moderator permissions
  await assignRolePermissions(prisma, RoleName.CONTENT_MODERATOR, [
    PermissionName.MODERATE_CONTENT,
    PermissionName.APPROVE_CONTENT,
    PermissionName.DELETE_CONTENT,
  ]);

  // Support Agent permissions
  await assignRolePermissions(prisma, RoleName.SUPPORT_AGENT, [
    PermissionName.VIEW_USERS,
    PermissionName.UPDATE_USERS,
    PermissionName.RESET_USER_MFA,
    PermissionName.UNLOCK_USER_ACCOUNT,
  ]);

  // System Admin permissions
  await assignRolePermissions(prisma, RoleName.SYSTEM_ADMIN, [
    PermissionName.MANAGE_SYSTEM_SETTINGS,
    PermissionName.VIEW_SYSTEM_LOGS,
    PermissionName.MANAGE_EMAIL_TEMPLATES,
    PermissionName.VIEW_AUDIT_LOGS,
  ]);

  // Finance Admin permissions
  await assignRolePermissions(prisma, RoleName.FINANCE_ADMIN, [
    PermissionName.VIEW_FINANCIAL_DATA,
    PermissionName.MANAGE_PAYMENTS,
    PermissionName.VIEW_TRANSACTION_LOGS,
  ]);

  // Audit Admin permissions
  await assignRolePermissions(prisma, RoleName.AUDIT_ADMIN, [
    PermissionName.VIEW_AUDIT_TRAILS,
    PermissionName.EXPORT_AUDIT_DATA,
    PermissionName.VIEW_AUDIT_LOGS,
  ]);
}

async function assignRolePermissions(prisma: PrismaClient, roleName: RoleName, permissionNames: PermissionName[]) {
  const role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) {
    console.log(`⚠️  Role not found: ${roleName}`);
    return;
  }

  for (const permissionName of permissionNames) {
    const permission = await prisma.permission.findUnique({ where: { name: permissionName } });
    if (!permission) {
      console.log(`⚠️  Permission not found: ${permissionName}`);
      continue;
    }

    // Check if permission is already assigned
    const existingAssignment = await prisma.rolePermission.findFirst({
      where: {
        roleId: role.id,
        permissionId: permission.id,
      },
    });

    if (!existingAssignment) {
      await prisma.rolePermission.create({
        data: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
      console.log(`✅ Assigned permission ${permissionName} to role ${roleName}`);
    } else {
      console.log(`ℹ️  Permission ${permissionName} already assigned to role ${roleName}`);
    }
  }
} 