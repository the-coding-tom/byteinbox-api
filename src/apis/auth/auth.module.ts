import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthenticationHelper } from '../../helpers/authentication';
import { QueueProducersModule } from '../../queues/queue-producers.module';
import { RepositoriesModule } from '../../repositories/repositories.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthValidator } from './auth.validator';

@Module({
  imports: [ConfigModule, RepositoriesModule, QueueProducersModule],
  controllers: [AuthController],
  providers: [AuthService, AuthValidator, AuthenticationHelper],
})
export class AuthModule {}
