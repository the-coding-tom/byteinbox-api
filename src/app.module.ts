import { BullModule } from '@nestjs/bull';
import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from './apis/auth/auth.module';
import { ApiKeysModule } from './apis/api-keys/api-keys.module';
import { TeamsModule } from './apis/teams/teams.module';
import { AccountModule } from './apis/account/account.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthMiddleware } from './common/middlewares/auth.middleware';
import { AdminMiddleware } from './common/middlewares/admin.middleware';
import { AdminAuditMiddleware } from './common/middlewares/admin-audit.middleware';
import { ApiKeyMiddleware } from './common/middlewares/api-key.middleware';
import { config } from './config/config';
import { CronsModule } from './crons/crons.module';
import { QueueProcessorsModule } from './queues/queue-processors.module';
import { RepositoriesModule } from './repositories/repositories.module';
import { SeedsModule } from './seeds/seeds.module';
import { AdminModule } from './apis/admin/admin.module';

@Module({
  imports: [
    // Global Bull configuration
    BullModule.forRoot({
      redis: config.redis.url,
    }),
    JwtModule.register({
      global: true,
      secret: config.authJWTSecret,
      signOptions: {
        expiresIn: config.tokenExpiration,
      },
    }),
    RepositoriesModule,
    QueueProcessorsModule,
    CronsModule,
    SeedsModule,
    AuthModule,
    ApiKeysModule,
    TeamsModule,
    AdminModule,
    AccountModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ApiKeyMiddleware).forRoutes(
      // Add routes that support API key authentication
      // ......
    );

    // Authentication middleware for all routes except public auth endpoints
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: 'api/v1/auth/login', method: RequestMethod.POST },
        { path: 'api/v1/auth/register', method: RequestMethod.POST },
        { path: 'api/v1/auth/oauth/*path', method: RequestMethod.ALL },
        { path: 'api/v1/auth/callback', method: RequestMethod.GET },
        { path: 'api/v1/auth/refresh', method: RequestMethod.POST },
        { path: 'api/v1/auth/password/forgot', method: RequestMethod.POST },
        { path: 'api/v1/auth/password/reset', method: RequestMethod.POST },
        { path: 'api/v1/auth/verify-email', method: RequestMethod.GET },
        { path: 'api/v1/auth/resend-verification', method: RequestMethod.POST },
        { path: 'api/v1/auth/2fa/verify', method: RequestMethod.POST },
        { path: 'api/v1/auth/2fa/email/verify', method: RequestMethod.POST },
        { path: 'api/v1/auth/2fa/email/send', method: RequestMethod.POST },
        { path: 'api/v1/auth/2fa/recovery/initiate', method: RequestMethod.POST },
        { path: 'api/v1/auth/2fa/recovery/verify', method: RequestMethod.POST },
        { path: 'api/v1/api-keys/public/test', method: RequestMethod.GET },
      )
      .forRoutes('*path');

    // Admin middleware for admin routes
    consumer
      .apply(AdminMiddleware)
      .forRoutes({ path: 'api/v1/admin/*path', method: RequestMethod.ALL });

    // Admin audit middleware for admin routes
    consumer
      .apply(AdminAuditMiddleware)
      .forRoutes({ path: 'api/v1/admin/*path', method: RequestMethod.ALL });
  }
}
