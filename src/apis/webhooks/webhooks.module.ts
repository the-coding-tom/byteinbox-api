import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { WebhooksValidator } from './webhooks.validator';
import { RepositoriesModule } from '../../repositories/repositories.module';

@Module({
  imports: [RepositoriesModule],
  controllers: [WebhooksController],
  providers: [WebhooksService, WebhooksValidator],
  exports: [WebhooksService],
})
export class WebhooksModule {}
