import { Module } from '@nestjs/common';
import { EmailsController } from './emails.controller';
import { EmailsService } from './emails.service';
import { EmailsValidator } from './emails.validator';
import { RepositoriesModule } from '../../repositories/repositories.module';

@Module({
  imports: [RepositoriesModule],
  controllers: [EmailsController],
  providers: [EmailsService, EmailsValidator],
  exports: [EmailsService],
})
export class EmailsModule {}
