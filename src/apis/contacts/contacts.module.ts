import { Module } from '@nestjs/common';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { ContactsValidator } from './contacts.validator';
import { RepositoriesModule } from '../../repositories/repositories.module';

@Module({
  imports: [RepositoriesModule],
  controllers: [ContactsController],
  providers: [ContactsService, ContactsValidator],
  exports: [ContactsService],
})
export class ContactsModule {}
