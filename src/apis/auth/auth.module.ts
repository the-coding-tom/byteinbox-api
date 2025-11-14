import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthValidator } from './auth.validator';
import { RepositoriesModule } from '../../repositories/repositories.module';
import { InternalNotificationModule } from '../../shared-services/internal-notification/internal-notification.module';

@Module({
  imports: [
    RepositoriesModule,
    JwtModule,
    InternalNotificationModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthValidator],
  exports: [AuthService, AuthValidator],
})
export class AuthModule {}