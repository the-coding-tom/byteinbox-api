import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { BROADCAST_PROCESSING_QUEUE, SEND_EMAIL_QUEUE } from '../../common/constants/queues.constant';
import { BroadcastRepository } from '../../repositories/broadcast.repository';
import { ContactRepository } from '../../repositories/contact.repository';
import prisma from '../../common/prisma';

@Processor(BROADCAST_PROCESSING_QUEUE)
export class BroadcastProcessingProcessor {
  private readonly logger = new Logger(BroadcastProcessingProcessor.name);

  constructor(
    private readonly broadcastRepository: BroadcastRepository,
    private readonly contactRepository: ContactRepository,
    @InjectQueue(SEND_EMAIL_QUEUE) private readonly sendEmailQueue: Queue,
  ) {}

  @Process()
  async processBroadcast(job: Job<{ broadcastId: number; teamId: number }>): Promise<void> {
    const { broadcastId, teamId } = job.data;

    try {
      this.logger.log(`Processing broadcast ${broadcastId} for team ${teamId}`);

      // Get broadcast details
      const broadcast = await this.broadcastRepository.findById(broadcastId, teamId);
      if (!broadcast) {
        this.logger.error(`Broadcast ${broadcastId} not found`);
        throw new Error('Broadcast not found');
      }

      // Update status to sending
      await this.broadcastRepository.update(broadcastId, {
        status: 'sending',
      });

      // Fetch contacts from audience in batches
      const batchSize = 100;
      let offset = 0;
      let totalEmailsCreated = 0;

      while (true) {
        // Fetch batch of contacts
        const contacts = await this.contactRepository.findByAudienceId(
          broadcast.audienceId,
          teamId
        );

        if (contacts.length === 0) {
          break;
        }

        // Process only the current batch
        const batchContacts = contacts.slice(offset, offset + batchSize);
        if (batchContacts.length === 0) {
          break;
        }

        // Create email records for each contact in batch
        for (const contact of batchContacts) {
          // Create email record with type=marketing and broadcastId set
          const email = await prisma.email.create({
            data: {
              teamId,
              type: 'marketing',
              broadcastId,
              from: broadcast.from,
              to: [contact.email],
              replyTo: broadcast.replyTo || [],
              subject: broadcast.subject,
              html: broadcast.html,
              text: broadcast.text,
            },
          });

          // Enqueue email for sending
          await this.sendEmailQueue.add(
            {
              emailId: email.id,
              teamId,
            },
            {
              removeOnComplete: true,
              attempts: 3,
            }
          );

          totalEmailsCreated++;
        }

        offset += batchSize;

        // If we've processed all contacts, break
        if (offset >= contacts.length) {
          break;
        }

        this.logger.log(`Processed ${offset} contacts for broadcast ${broadcastId}`);
      }

      // Update broadcast status to sent
      await this.broadcastRepository.update(broadcastId, {
        status: 'sent',
        sentAt: new Date(),
      });

      this.logger.log(
        `Broadcast ${broadcastId} processing complete. Created ${totalEmailsCreated} emails`
      );
    } catch (error) {
      this.logger.error(`Error processing broadcast ${broadcastId}: ${error.message}`, error.stack);

      // Update broadcast status to failed
      await this.broadcastRepository.update(broadcastId, {
        status: 'failed',
      });

      throw error;
    }
  }
}
