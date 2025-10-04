import { Module } from '@nestjs/common';
import { CoreAuthModule } from './core/core-auth.module';
import { PasswordModule } from './password/password.module';
import { ProfileModule } from './profile/profile.module';
import { SessionsModule } from './sessions/sessions.module';
import { TwoFactorModule } from './two-factor/two-factor.module';

@Module({
  imports: [
    CoreAuthModule,
    PasswordModule,
    ProfileModule,
    SessionsModule,
    TwoFactorModule,
  ],
  exports: [
    CoreAuthModule,
    PasswordModule,
    ProfileModule,
    SessionsModule,
    TwoFactorModule,
  ],
})
export class AuthModule {}
