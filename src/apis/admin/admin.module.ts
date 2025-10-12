import { Module } from '@nestjs/common';
import { AdminUsersModule } from './users/users.module';
import { AdminSecurityModule } from './security/security.module';
import { RepositoriesModule } from '../../repositories/repositories.module';
import { QueueProducersModule } from '../../queues/queue-producers.module';

@Module({
  imports: [
    RepositoriesModule,
    QueueProducersModule,
    AdminUsersModule,
    AdminSecurityModule,
  ],
  exports: [AdminUsersModule, AdminSecurityModule],
})
export class AdminModule {} 