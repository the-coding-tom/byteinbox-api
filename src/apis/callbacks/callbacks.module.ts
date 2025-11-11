import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { CallbacksController } from './callbacks.controller';
import { CallbacksService } from './callbacks.service';
import { PROCESS_EMAIL_EVENT_QUEUE } from '../../common/constants/queues.constant';

@Module({
  imports: [
    BullModule.registerQueue({
      name: PROCESS_EMAIL_EVENT_QUEUE,
    }),
  ],
  controllers: [CallbacksController],
  providers: [CallbacksService],
  exports: [CallbacksService],
})
export class CallbacksModule { }
