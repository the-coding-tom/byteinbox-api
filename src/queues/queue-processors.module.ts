import { Module } from '@nestjs/common';

import { RepositoriesModule } from '../repositories/repositories.module';
import { WebhookPublisherModule } from '../shared-services/webhook-publisher/webhook-publisher.module';
import { EmailEnqueuerModule } from '../shared-services/email-enqueuer/email-enqueuer.module';

import { NotificationQueueProcessor } from './processors/notification.processor';
import { AwsSesVerificationQueueProcessor } from './processors/aws-ses-verification.processor';
import { DnsRecordsVerificationQueueProcessor } from './processors/dns-records-verification.processor';
import { EmailRouterQueueProcessor } from './processors/email-router.processor';
import { EmailTemplateQueueProcessor } from './processors/email-template.processor';
import { EmailAttachmentQueueProcessor } from './processors/email-attachment.processor';
import { EmailSendingQueueProcessor } from './processors/email-sending.processor';
import { EmailEventQueueProcessor } from './processors/email-event.processor';
import { TemplatePreviewQueueProcessor } from './processors/template-preview.processor';
import { WebhookDeliveryQueueProcessor } from './processors/webhook-delivery.processor';
import { BroadcastProcessingProcessor } from './processors/broadcast-processing.processor';
import { InternalNotificationProcessor } from './processors/internal-notification.processor';
import { QueueProducersModule } from './queue-producers.module';

@Module({
  imports: [
    QueueProducersModule, // Import queues from producers module
    RepositoriesModule, // Processors need access to repositories
    WebhookPublisherModule, // Processors need access to webhook publisher service
    EmailEnqueuerModule, // Processors need access to email enqueuer service
  ],
  providers: [
    // Queue processors
    NotificationQueueProcessor,
    AwsSesVerificationQueueProcessor,
    DnsRecordsVerificationQueueProcessor,
    EmailRouterQueueProcessor,
    EmailTemplateQueueProcessor,
    EmailAttachmentQueueProcessor,
    EmailSendingQueueProcessor,
    EmailEventQueueProcessor,
    TemplatePreviewQueueProcessor,
    WebhookDeliveryQueueProcessor,
    BroadcastProcessingProcessor,
    InternalNotificationProcessor,
  ],
  exports: [
    NotificationQueueProcessor,
    AwsSesVerificationQueueProcessor,
    DnsRecordsVerificationQueueProcessor,
    EmailRouterQueueProcessor,
    EmailTemplateQueueProcessor,
    EmailAttachmentQueueProcessor,
    EmailSendingQueueProcessor,
    EmailEventQueueProcessor,
    TemplatePreviewQueueProcessor,
    WebhookDeliveryQueueProcessor,
    BroadcastProcessingProcessor,
    InternalNotificationProcessor,
  ],
})
export class QueueProcessorsModule {}
