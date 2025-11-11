import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { EmailEnqueuerService } from './email-enqueuer.service';
import { SEND_EMAIL_QUEUE } from '../../common/constants/queues.constant';
import { RepositoriesModule } from '../../repositories/repositories.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: SEND_EMAIL_QUEUE,
    }),
    RepositoriesModule,
  ],
  providers: [EmailEnqueuerService],
  exports: [EmailEnqueuerService],
})
export class EmailEnqueuerModule {}
