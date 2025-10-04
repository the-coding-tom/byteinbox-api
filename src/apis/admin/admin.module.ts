import { Module } from '@nestjs/common';
import { AdminUsersModule } from './users/users.module';
import { AdminSecurityModule } from './security/security.module';
import { AdminRolesModule } from './roles/roles.module';
import { RepositoriesModule } from '../../repositories/repositories.module';
import { QueueProducersModule } from '../../queues/queue-producers.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    RepositoriesModule, 
    QueueProducersModule,
    AuthModule,
    AdminUsersModule,
    AdminSecurityModule,
    AdminRolesModule,
  ],
  exports: [AdminUsersModule, AdminSecurityModule, AdminRolesModule],
})
export class AdminModule {} 