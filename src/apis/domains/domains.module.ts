import { Module } from '@nestjs/common';
import { DomainsController } from './domains.controller';
import { DomainsService } from './domains.service';
import { DomainsValidator } from './domains.validator';
import { RepositoriesModule } from '../../repositories/repositories.module';

@Module({
  imports: [RepositoriesModule],
  controllers: [DomainsController],
  providers: [DomainsService, DomainsValidator],
  exports: [DomainsService],
})
export class DomainsModule {}
