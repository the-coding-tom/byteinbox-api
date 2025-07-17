import { Module } from '@nestjs/common';

import { AuthRepository } from './auth.repository';
import { EmailTemplateRepository } from './email-template.repository';
import { UserRepository } from './user.repository';
// Import other repositories as they are created
// import { CustomerRepository } from './customer.repository';
// import { AccountRepository } from './account.repository';
// import { TransactionRepository } from './transaction.repository';

@Module({
  providers: [
    // Core repositories
    UserRepository,
    AuthRepository,
    EmailTemplateRepository,
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
    AuthRepository,
    EmailTemplateRepository,
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
