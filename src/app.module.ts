import { BullModule } from '@nestjs/bull';
import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from './apis/auth/auth.module';
import { ProfileModule } from './apis/profile/profile.module';
import { ApiKeysModule } from './apis/api-keys/api-keys.module';
import { TeamsModule } from './apis/teams/teams.module';
import { AccountModule } from './apis/account/account.module';
import { OnboardingModule } from './apis/onboarding/onboarding.module';
import { DomainsModule } from './apis/domains/domains.module';
import { EmailsModule } from './apis/emails/emails.module';
import { TemplatesModule } from './apis/templates/templates.module';
import { WebhooksModule } from './apis/webhooks/webhooks.module';
import { ContactsModule } from './apis/contacts/contacts.module';
import { BroadcastsModule } from './apis/broadcasts/broadcasts.module';
import { AudiencesModule } from './apis/audiences/audiences.module';
import { MetricsModule } from './apis/metrics/metrics.module';
import { LogsModule } from './apis/logs/logs.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { IsAuthenticatedMiddleware } from './common/middlewares/is-authenticated.middleware';
import { IsUserScopeMiddleware } from './common/middlewares/is-user-scope.middleware';
import { AdminMiddleware } from './common/middlewares/admin.middleware';
import { AdminAuditMiddleware } from './common/middlewares/admin-audit.middleware';
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
    ProfileModule,
    ApiKeysModule,
    TeamsModule,
    AdminModule,
    AccountModule,
    OnboardingModule,
    DomainsModule,
    EmailsModule,
    TemplatesModule,
    WebhooksModule,
    ContactsModule,
    BroadcastsModule,
    AudiencesModule,
    MetricsModule,
    LogsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {

    // Authentication middleware for all routes except public auth endpoints
    consumer
      .apply(IsAuthenticatedMiddleware)
      .exclude(
        { path: 'api/v1/auth/signup', method: RequestMethod.POST },
        { path: 'api/v1/auth/login', method: RequestMethod.POST },
        { path: 'api/v1/auth/refresh', method: RequestMethod.POST },
        { path: 'api/v1/auth/reset-password', method: RequestMethod.POST },
        { path: 'api/v1/auth/confirm-password-reset', method: RequestMethod.POST },
        { path: 'api/v1/auth/verify-email', method: RequestMethod.POST },
        { path: 'api/v1/auth/resend-verification', method: RequestMethod.POST },
        { path: 'api/v1/auth/mfa/challenge', method: RequestMethod.POST },
        { path: 'api/v1/auth/google', method: RequestMethod.GET },
        { path: 'api/v1/auth/google/callback', method: RequestMethod.GET },
        { path: 'api/v1/auth/github', method: RequestMethod.GET },
        { path: 'api/v1/auth/github/callback', method: RequestMethod.GET },
      )
      .forRoutes('*path');

    // User-scoped middleware (JWT only - no API keys)
    consumer
      .apply(IsUserScopeMiddleware)
      .forRoutes(
        { path: 'api/v1/profile', method: RequestMethod.ALL },
        { path: 'api/v1/profile/*path', method: RequestMethod.ALL },
        { path: 'api/v1/account', method: RequestMethod.ALL },
        { path: 'api/v1/account/*path', method: RequestMethod.ALL },
        { path: 'api/v1/auth/logout', method: RequestMethod.POST },
        { path: 'api/v1/auth/logout-all-devices', method: RequestMethod.POST },
        { path: 'api/v1/auth/change-password', method: RequestMethod.POST },
        { path: 'api/v1/auth/mfa/setup', method: RequestMethod.POST },
        { path: 'api/v1/auth/mfa/verify', method: RequestMethod.POST },
        { path: 'api/v1/auth/mfa/disable', method: RequestMethod.POST },
        { path: 'api/v1/auth/mfa/backup-codes', method: RequestMethod.GET },
        { path: 'api/v1/auth/mfa/backup-codes/consume', method: RequestMethod.POST },
        { path: 'api/v1/auth/mfa/backup-codes/regenerate', method: RequestMethod.POST },
      );

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
