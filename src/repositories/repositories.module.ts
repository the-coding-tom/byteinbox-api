import { Module } from '@nestjs/common';
import { EmailTemplateRepository } from './email-template.repository';
import { UserRepository } from './user.repository';
import { SessionRepository } from './session.repository';
import { MfaVerificationSessionRepository } from './mfa-verification-session.repository';
import { BlacklistRepository } from './blacklist.repository';
import { ApiKeyRepository } from './api-key.repository';
import { BackupCodeRepository } from './backup-code.repository';
import { DomainRepository } from './domain.repository';
import { TeamRepository } from './team.repository';
import { OAuthAccountRepository } from './oauth-account.repository';

@Module({
  providers: [
    UserRepository,
    SessionRepository,
    MfaVerificationSessionRepository,
    BlacklistRepository,
    EmailTemplateRepository,
    ApiKeyRepository,
    BackupCodeRepository,
    DomainRepository,
    TeamRepository,
    OAuthAccountRepository,
  ],
  exports: [
    UserRepository,
    SessionRepository,
    MfaVerificationSessionRepository,
    BlacklistRepository,
    EmailTemplateRepository,
    ApiKeyRepository,
    BackupCodeRepository,
    DomainRepository,
    TeamRepository,
    OAuthAccountRepository,
  ],
})
export class RepositoriesModule {}
