import { Module } from '@nestjs/common';

import { EmailTemplateRepository } from './email-template.repository';
import { UserRepository } from './user.repository';
import { SessionRepository } from './session.repository';
import { MfaRepository } from './mfa.repository';
import { BlacklistRepository } from './blacklist.repository';
import { RoleRepository } from './role.repository';
import { PermissionRepository } from './permission.repository';
import { ApiKeyRepository } from './api-key.repository';
import { TeamApiKeyRepository } from './team-api-key.repository';
import { BackupCodeRepository } from './backup-code.repository';
import { LoginActivityRepository } from './login-activity.repository';
// Import other repositories as they are created
// import { CustomerRepository } from './customer.repository';
// import { AccountRepository } from './account.repository';
// import { TransactionRepository } from './transaction.repository';

@Module({
  providers: [
    // Core repositories
    UserRepository,
    SessionRepository,
    MfaRepository,
    BlacklistRepository,
    EmailTemplateRepository,
    RoleRepository,
    PermissionRepository,
    ApiKeyRepository,
    TeamApiKeyRepository,
    BackupCodeRepository,
    LoginActivityRepository,
    // CustomerRepository,
    // AccountRepository,
    // TransactionRepository,

    // B2B repositories
    // PartnerRepository,
    // B2BAccountRepository,

    // Supporting repositories
    // StatisticsRepository,
    // WebhookEventRepository,

    // Feature-specific repositories
    // PaymentRepository,
    // DisbursementRepository,
  ],
  exports: [
    // Export all repositories for use in other modules
    UserRepository,
    SessionRepository,
    MfaRepository,
    BlacklistRepository,
    EmailTemplateRepository,
    RoleRepository,
    PermissionRepository,
    ApiKeyRepository,
    TeamApiKeyRepository,
    BackupCodeRepository,
    LoginActivityRepository,
    // CustomerRepository,
    // AccountRepository,
    // TransactionRepository,
    // PartnerRepository,
    // B2BAccountRepository,
    // StatisticsRepository,
    // WebhookEventRepository,
    // PaymentRepository,
    // DisbursementRepository,
  ],
})
export class RepositoriesModule {}
