import { Injectable, OnApplicationBootstrap } from '@nestjs/common';

import prisma from '../common/prisma';
import { seedEmailTemplates } from './email-templates.seed';

@Injectable()
export class SeederService implements OnApplicationBootstrap {
  async onApplicationBootstrap() {
    console.log('🚀 Starting database seeding...');
    
    try {
      // Seed email templates
      await seedEmailTemplates(prisma);
      
      console.log('✅ Database seeding completed successfully!');
    } catch (error) {
      console.error('❌ Error during seeding:', error);
      // Don't throw error to prevent app from crashing
      // Just log it and continue
    }
  }
} 