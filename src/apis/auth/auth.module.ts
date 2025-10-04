import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthValidator } from './auth.validator';
import { RepositoriesModule } from '../../repositories/repositories.module';

@Module({
  imports: [
    RepositoriesModule,
    JwtModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthValidator],
  exports: [AuthService, AuthValidator],
})
export class AuthModule {}