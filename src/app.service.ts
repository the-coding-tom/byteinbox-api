import { Injectable, OnModuleInit } from '@nestjs/common';

import { EmailTemplateRepository } from './repositories/email-template.repository';
import { EmailTemplateUtil } from './utils/email-template.util';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(private readonly emailTemplateRepository: EmailTemplateRepository) {}

  async onModuleInit() {
    // Initialize email template utility with repository
    EmailTemplateUtil.initialize(this.emailTemplateRepository);
  }

  getHello(): string {
    return 'Hello World!';
  }
}
