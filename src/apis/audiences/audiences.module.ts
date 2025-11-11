import { Module } from '@nestjs/common';
import { AudiencesController } from './audiences.controller';
import { AudiencesService } from './audiences.service';
import { AudiencesValidator } from './audiences.validator';
import { RepositoriesModule } from '../../repositories/repositories.module';
import { WebhookPublisherModule } from '../../shared-services/webhook-publisher/webhook-publisher.module';

@Module({
  imports: [RepositoriesModule, WebhookPublisherModule],
  controllers: [AudiencesController],
  providers: [AudiencesService, AudiencesValidator],
  exports: [AudiencesService],
})
export class AudiencesModule {}
