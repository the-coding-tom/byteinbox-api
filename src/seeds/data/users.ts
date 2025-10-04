import { PrismaClient, UserType } from '@prisma/client';
import { hashPassword } from '../../utils/authentication.util';

export async function seedUsers(prisma: PrismaClient) {
  console.log('📝 Seeding users...');

  // Super Admin - Only create if environment variables are set
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;
  const superAdminFirstName = process.env.SUPER_ADMIN_FIRST_NAME || 'Super';
  const superAdminLastName = process.env.SUPER_ADMIN_LAST_NAME || 'Admin';

  if (superAdminEmail && superAdminPassword) {
    const existingSuperAdmin = await prisma.user.findFirst({
      where: {
        email: superAdminEmail,
        userType: UserType.ADMIN,
      },
    });

    if (!existingSuperAdmin) {
      const hashedPassword = await hashPassword(superAdminPassword);
      
      const superAdminUser = await prisma.user.create({
        data: {
          email: superAdminEmail,
          password: hashedPassword,
          firstName: superAdminFirstName,
          lastName: superAdminLastName,
          userType: UserType.ADMIN,
          isEmailVerified: true,
          status: 'ACTIVE',
        },
      });

      console.log(`✅ Created super admin user: ${superAdminUser.email}`);
    } else {
      console.log(`ℹ️  Super admin user already exists: ${superAdminEmail}`);
    }
  } else {
    console.log('⚠️  Super admin credentials not provided in environment variables');
    console.log('   Set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD to create super admin');
  }

  // Development Admin - Only create in development
  if (process.env.NODE_ENV === 'development') {
    const existingDevAdmin = await prisma.user.findFirst({
      where: {
        email: 'admin@example.com',
      },
    });

    if (!existingDevAdmin) {
      const hashedPassword = await hashPassword('admin123');
      
      const devAdminUser = await prisma.user.create({
        data: {
          email: 'admin@example.com',
          password: hashedPassword,
          firstName: 'Dev',
          lastName: 'Admin',
          userType: UserType.ADMIN,
          isEmailVerified: true,
          status: 'ACTIVE',
        },
      });

      console.log(`✅ Created development admin user: ${devAdminUser.email}`);
    } else {
      console.log('ℹ️  Development admin user already exists');
    }

    // Development regular user
    const existingDevUser = await prisma.user.findFirst({
      where: {
        email: 'user@example.com',
      },
    });

    if (!existingDevUser) {
      const hashedPassword = await hashPassword('user123');
      
      const devUser = await prisma.user.create({
        data: {
          email: 'user@example.com',
          password: hashedPassword,
          firstName: 'Dev',
          lastName: 'User',
          userType: UserType.USER,
          isEmailVerified: true,
          status: 'ACTIVE',
        },
      });

      console.log(`✅ Created development user: ${devUser.email}`);
    } else {
      console.log('ℹ️  Development user already exists');
    }
  } else {
    console.log('ℹ️  Skipping development users in production environment');
  }
} 