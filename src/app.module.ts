import { BullModule } from '@nestjs/bull';
import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthModule } from './apis/auth/auth.module';
import { UsersModule } from './apis/users/users.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JWT_ACCESS_TOKEN_EXPIRY_FORMAT } from './common/constants/time.constant';
import { AuthMiddleware } from './common/middlewares/auth.middleware';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { RequestIdMiddleware } from './common/middlewares/request-id.middleware';
import { config } from './config/config';
import { CronsModule } from './crons/crons.module';
import { QueueProcessorsModule } from './queues/queue-processors.module';
import { RepositoriesModule } from './repositories/repositories.module';

@Module({
  imports: [
    // Global Bull configuration
    BullModule.forRoot({
      redis: config.redis.url,
    }),
    RepositoriesModule,
    QueueProcessorsModule,
    CronsModule,
    // Feature modules
    UsersModule,
    AuthModule,
    // JWT Module for global use (needed by middleware and other modules)
    JwtModule.register({
      global: true,
      secret: config.authJWTSecret,
      signOptions: {
        expiresIn: JWT_ACCESS_TOKEN_EXPIRY_FORMAT,
      },
    }),
    // Other feature modules will be added here as they are created
    // PaymentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestIdMiddleware, LoggerMiddleware) // Apply global middlewares
      .forRoutes('*path') // Apply to all routes using modern syntax
      .apply(AuthMiddleware) // Apply auth middleware
      .forRoutes(
        { path: 'auth/profile', method: RequestMethod.GET },
        { path: 'auth/logout', method: RequestMethod.POST },
        { path: 'auth/mfa/*path', method: RequestMethod.ALL },
        { path: 'auth/otp/*path', method: RequestMethod.ALL },
        { path: 'auth/profile/*path', method: RequestMethod.ALL },
        { path: 'auth/change-password', method: RequestMethod.POST },
        { path: 'auth/deactivate', method: RequestMethod.POST },
        { path: 'auth/delete', method: RequestMethod.POST },
        { path: 'auth/sessions/*path', method: RequestMethod.ALL },
        { path: 'auth/security-activity', method: RequestMethod.GET },
        { path: 'users/*path', method: RequestMethod.ALL },
      ); // Apply to specific protected routes
  }
}
