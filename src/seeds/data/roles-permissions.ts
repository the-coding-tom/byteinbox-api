import { PrismaClient, RoleName, PermissionName } from '@prisma/client';

export async function seedRolesAndPermissions(prisma: PrismaClient) {
  console.log('📝 Seeding roles and permissions...');

  // Create default roles
  const defaultRoles = [
    { name: RoleName.SUPER_ADMIN, description: 'Full system access with all permissions' },
    { name: RoleName.ADMIN, description: 'Administrative access to manage users and content' },
    { name: RoleName.MANAGER, description: 'Can manage team resources and content' },
    { name: RoleName.USER, description: 'Standard user with basic permissions' },
    { name: RoleName.GUEST, description: 'Limited read-only access' },
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
    { name: PermissionName.USER_CREATE, description: 'Can create new user accounts' },
    { name: PermissionName.USER_READ, description: 'Can view user accounts' },
    { name: PermissionName.USER_UPDATE, description: 'Can update user account information' },
    { name: PermissionName.USER_DELETE, description: 'Can delete user accounts' },
    { name: PermissionName.USER_LIST, description: 'Can list all users' },

    // Role Management
    { name: PermissionName.ROLE_CREATE, description: 'Can create new roles' },
    { name: PermissionName.ROLE_READ, description: 'Can view role details' },
    { name: PermissionName.ROLE_UPDATE, description: 'Can update role information' },
    { name: PermissionName.ROLE_DELETE, description: 'Can delete roles' },
    { name: PermissionName.ROLE_LIST, description: 'Can list all roles' },

    // Permission Management
    { name: PermissionName.PERMISSION_CREATE, description: 'Can create new permissions' },
    { name: PermissionName.PERMISSION_READ, description: 'Can view permission details' },
    { name: PermissionName.PERMISSION_UPDATE, description: 'Can update permission information' },
    { name: PermissionName.PERMISSION_DELETE, description: 'Can delete permissions' },
    { name: PermissionName.PERMISSION_LIST, description: 'Can list all permissions' },

    // Domain Management
    { name: PermissionName.DOMAIN_CREATE, description: 'Can create new domains' },
    { name: PermissionName.DOMAIN_READ, description: 'Can view domain details' },
    { name: PermissionName.DOMAIN_UPDATE, description: 'Can update domain settings' },
    { name: PermissionName.DOMAIN_DELETE, description: 'Can delete domains' },
    { name: PermissionName.DOMAIN_LIST, description: 'Can list all domains' },

    // Email Management
    { name: PermissionName.EMAIL_CREATE, description: 'Can create emails' },
    { name: PermissionName.EMAIL_READ, description: 'Can view emails' },
    { name: PermissionName.EMAIL_UPDATE, description: 'Can update emails' },
    { name: PermissionName.EMAIL_DELETE, description: 'Can delete emails' },
    { name: PermissionName.EMAIL_LIST, description: 'Can list all emails' },
    { name: PermissionName.EMAIL_SEND, description: 'Can send emails' },

    // Template Management
    { name: PermissionName.TEMPLATE_CREATE, description: 'Can create email templates' },
    { name: PermissionName.TEMPLATE_READ, description: 'Can view email templates' },
    { name: PermissionName.TEMPLATE_UPDATE, description: 'Can update email templates' },
    { name: PermissionName.TEMPLATE_DELETE, description: 'Can delete email templates' },
    { name: PermissionName.TEMPLATE_LIST, description: 'Can list all templates' },

    // Webhook Management
    { name: PermissionName.WEBHOOK_CREATE, description: 'Can create webhooks' },
    { name: PermissionName.WEBHOOK_READ, description: 'Can view webhooks' },
    { name: PermissionName.WEBHOOK_UPDATE, description: 'Can update webhooks' },
    { name: PermissionName.WEBHOOK_DELETE, description: 'Can delete webhooks' },
    { name: PermissionName.WEBHOOK_LIST, description: 'Can list all webhooks' },

    // Contact Management
    { name: PermissionName.CONTACT_CREATE, description: 'Can create contacts' },
    { name: PermissionName.CONTACT_READ, description: 'Can view contacts' },
    { name: PermissionName.CONTACT_UPDATE, description: 'Can update contacts' },
    { name: PermissionName.CONTACT_DELETE, description: 'Can delete contacts' },
    { name: PermissionName.CONTACT_LIST, description: 'Can list all contacts' },

    // Audience Management
    { name: PermissionName.AUDIENCE_CREATE, description: 'Can create audiences' },
    { name: PermissionName.AUDIENCE_READ, description: 'Can view audiences' },
    { name: PermissionName.AUDIENCE_UPDATE, description: 'Can update audiences' },
    { name: PermissionName.AUDIENCE_DELETE, description: 'Can delete audiences' },
    { name: PermissionName.AUDIENCE_LIST, description: 'Can list all audiences' },

    // Broadcast Management
    { name: PermissionName.BROADCAST_CREATE, description: 'Can create broadcasts' },
    { name: PermissionName.BROADCAST_READ, description: 'Can view broadcasts' },
    { name: PermissionName.BROADCAST_UPDATE, description: 'Can update broadcasts' },
    { name: PermissionName.BROADCAST_DELETE, description: 'Can delete broadcasts' },
    { name: PermissionName.BROADCAST_LIST, description: 'Can list all broadcasts' },
    { name: PermissionName.BROADCAST_SEND, description: 'Can send broadcasts' },

    // Analytics & Metrics
    { name: PermissionName.METRICS_READ, description: 'Can view metrics and analytics' },
    { name: PermissionName.ANALYTICS_READ, description: 'Can view detailed analytics' },

    // System Administration
    { name: PermissionName.SYSTEM_ADMIN, description: 'Full system administration access' },
    { name: PermissionName.SYSTEM_SETTINGS, description: 'Can manage system settings' },

    // Team Management
    { name: PermissionName.TEAM_CREATE, description: 'Can create teams' },
    { name: PermissionName.TEAM_READ, description: 'Can view team details' },
    { name: PermissionName.TEAM_UPDATE, description: 'Can update team information' },
    { name: PermissionName.TEAM_DELETE, description: 'Can delete teams' },
    { name: PermissionName.TEAM_LIST, description: 'Can list all teams' },
    { name: PermissionName.TEAM_MEMBER_INVITE, description: 'Can invite team members' },
    { name: PermissionName.TEAM_MEMBER_REMOVE, description: 'Can remove team members' },
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
  // SUPER_ADMIN - All permissions
  await assignRolePermissions(prisma, RoleName.SUPER_ADMIN, [
    // All User permissions
    PermissionName.USER_CREATE,
    PermissionName.USER_READ,
    PermissionName.USER_UPDATE,
    PermissionName.USER_DELETE,
    PermissionName.USER_LIST,
    // All Role permissions
    PermissionName.ROLE_CREATE,
    PermissionName.ROLE_READ,
    PermissionName.ROLE_UPDATE,
    PermissionName.ROLE_DELETE,
    PermissionName.ROLE_LIST,
    // All Permission permissions
    PermissionName.PERMISSION_CREATE,
    PermissionName.PERMISSION_READ,
    PermissionName.PERMISSION_UPDATE,
    PermissionName.PERMISSION_DELETE,
    PermissionName.PERMISSION_LIST,
    // System permissions
    PermissionName.SYSTEM_ADMIN,
    PermissionName.SYSTEM_SETTINGS,
  ]);

  // ADMIN - Most permissions except system-level
  await assignRolePermissions(prisma, RoleName.ADMIN, [
    // User management
    PermissionName.USER_CREATE,
    PermissionName.USER_READ,
    PermissionName.USER_UPDATE,
    PermissionName.USER_DELETE,
    PermissionName.USER_LIST,
    // Domain management
    PermissionName.DOMAIN_CREATE,
    PermissionName.DOMAIN_READ,
    PermissionName.DOMAIN_UPDATE,
    PermissionName.DOMAIN_DELETE,
    PermissionName.DOMAIN_LIST,
    // Email management
    PermissionName.EMAIL_CREATE,
    PermissionName.EMAIL_READ,
    PermissionName.EMAIL_UPDATE,
    PermissionName.EMAIL_DELETE,
    PermissionName.EMAIL_LIST,
    PermissionName.EMAIL_SEND,
    // Template management
    PermissionName.TEMPLATE_CREATE,
    PermissionName.TEMPLATE_READ,
    PermissionName.TEMPLATE_UPDATE,
    PermissionName.TEMPLATE_DELETE,
    PermissionName.TEMPLATE_LIST,
    // Team management
    PermissionName.TEAM_READ,
    PermissionName.TEAM_UPDATE,
    PermissionName.TEAM_MEMBER_INVITE,
    PermissionName.TEAM_MEMBER_REMOVE,
    // Analytics
    PermissionName.METRICS_READ,
    PermissionName.ANALYTICS_READ,
  ]);

  // MANAGER - Team and content management
  await assignRolePermissions(prisma, RoleName.MANAGER, [
    // User viewing
    PermissionName.USER_READ,
    PermissionName.USER_LIST,
    // Domain management
    PermissionName.DOMAIN_CREATE,
    PermissionName.DOMAIN_READ,
    PermissionName.DOMAIN_UPDATE,
    PermissionName.DOMAIN_LIST,
    // Email management
    PermissionName.EMAIL_CREATE,
    PermissionName.EMAIL_READ,
    PermissionName.EMAIL_UPDATE,
    PermissionName.EMAIL_LIST,
    PermissionName.EMAIL_SEND,
    // Template management
    PermissionName.TEMPLATE_CREATE,
    PermissionName.TEMPLATE_READ,
    PermissionName.TEMPLATE_UPDATE,
    PermissionName.TEMPLATE_LIST,
    // Webhook management
    PermissionName.WEBHOOK_CREATE,
    PermissionName.WEBHOOK_READ,
    PermissionName.WEBHOOK_UPDATE,
    PermissionName.WEBHOOK_LIST,
    // Contact management
    PermissionName.CONTACT_CREATE,
    PermissionName.CONTACT_READ,
    PermissionName.CONTACT_UPDATE,
    PermissionName.CONTACT_LIST,
    // Audience management
    PermissionName.AUDIENCE_CREATE,
    PermissionName.AUDIENCE_READ,
    PermissionName.AUDIENCE_UPDATE,
    PermissionName.AUDIENCE_LIST,
    // Broadcast management
    PermissionName.BROADCAST_CREATE,
    PermissionName.BROADCAST_READ,
    PermissionName.BROADCAST_UPDATE,
    PermissionName.BROADCAST_LIST,
    PermissionName.BROADCAST_SEND,
    // Team management
    PermissionName.TEAM_READ,
    PermissionName.TEAM_MEMBER_INVITE,
    // Analytics
    PermissionName.METRICS_READ,
  ]);

  // USER - Basic permissions
  await assignRolePermissions(prisma, RoleName.USER, [
    // Email management
    PermissionName.EMAIL_CREATE,
    PermissionName.EMAIL_READ,
    PermissionName.EMAIL_LIST,
    PermissionName.EMAIL_SEND,
    // Template viewing
    PermissionName.TEMPLATE_READ,
    PermissionName.TEMPLATE_LIST,
    // Contact management
    PermissionName.CONTACT_CREATE,
    PermissionName.CONTACT_READ,
    PermissionName.CONTACT_UPDATE,
    PermissionName.CONTACT_LIST,
    // Audience viewing
    PermissionName.AUDIENCE_READ,
    PermissionName.AUDIENCE_LIST,
    // Broadcast viewing
    PermissionName.BROADCAST_READ,
    PermissionName.BROADCAST_LIST,
  ]);

  // GUEST - Read-only permissions
  await assignRolePermissions(prisma, RoleName.GUEST, [
    // View only
    PermissionName.EMAIL_READ,
    PermissionName.EMAIL_LIST,
    PermissionName.TEMPLATE_READ,
    PermissionName.TEMPLATE_LIST,
    PermissionName.CONTACT_READ,
    PermissionName.CONTACT_LIST,
    PermissionName.AUDIENCE_READ,
    PermissionName.AUDIENCE_LIST,
    PermissionName.BROADCAST_READ,
    PermissionName.BROADCAST_LIST,
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