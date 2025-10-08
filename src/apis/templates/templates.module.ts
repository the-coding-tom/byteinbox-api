import { Module } from '@nestjs/common';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';
import { TemplatesValidator } from './templates.validator';
import { RepositoriesModule } from '../../repositories/repositories.module';

@Module({
  imports: [RepositoriesModule],
  controllers: [TemplatesController],
  providers: [TemplatesService, TemplatesValidator],
  exports: [TemplatesService],
})
export class TemplatesModule {}
