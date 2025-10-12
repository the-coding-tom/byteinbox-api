import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import prisma from '../common/prisma';
import { seedEmailTemplates } from './data/email-templates';
import { seedUsers } from './data/users';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  async onApplicationBootstrap() {
    console.log('🚀 Starting database seeding...');
    
    try {
      // Seed users (admin and regular user)
      await seedUsers(prisma);
      console.log('✅ Users seeded');
      
      // Seed email templates
      await seedEmailTemplates(prisma);
      console.log('✅ Email templates seeded');
      
      console.log('✅ All database seeding completed successfully!');
    } catch (error) {
      console.error('❌ Error during seeding:', error);
      // Don't throw error to prevent app from crashing
      // Just log it and continue
    }
  }
} 