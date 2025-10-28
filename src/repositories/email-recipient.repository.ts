import { Injectable } from '@nestjs/common';
import { EmailStatus } from '@prisma/client';
import prisma from '../common/prisma';

@Injectable()
export class EmailRecipientRepository {
  /**
   * Find all recipients for an email
   */
  async findByEmailId(emailId: number): Promise<any[]> {
    return prisma.emailRecipient.findMany({
      where: { emailId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Find recipient by messageId (now unique per recipient)
   */
  async findByMessageId(messageId: string): Promise<any | null> {
    return prisma.emailRecipient.findFirst({
      where: { messageId },
    });
  }

  /**
   * Update recipient with messageId and mark as sent
   */
  async updateMessageIdAndSent(recipientId: number, messageId: string): Promise<any> {
    return prisma.emailRecipient.update({
      where: { id: recipientId },
      data: {
        messageId,
        status: EmailStatus.sent,
        sentAt: new Date(),
      },
    });
  }

  /**
   * Update recipient status
   */
  async updateStatus(
    messageId: string,
    recipient: string,
    status: EmailStatus,
    additionalData?: any
  ): Promise<any> {
    return prisma.emailRecipient.updateMany({
      where: {
        messageId,
        recipient,
      },
      data: {
        status,
        ...additionalData,
      },
    });
  }

  /**
   * Increment opens count for a recipient by ID
   */
  async incrementOpens(recipientId: number, openedAt?: Date): Promise<any> {
    return prisma.emailRecipient.update({
      where: { id: recipientId },
      data: {
        opens: { increment: 1 },
        lastOpened: new Date(),
        ...(openedAt && { openedAt }),
      },
    });
  }

  /**
   * Increment clicks count for a recipient by ID
   */
  async incrementClicks(recipientId: number): Promise<any> {
    return prisma.emailRecipient.update({
      where: { id: recipientId },
      data: {
        clicks: { increment: 1 },
        lastClicked: new Date(),
      },
    });
  }

  /**
   * Create an email event for a recipient by ID
   */
  async createEmailEvent(
    emailRecipientId: number,
    eventData: {
      type: string;
      bounceType?: string;
      bounceSubType?: string;
      complaintFeedbackType?: string;
      userAgent?: string;
      ipAddress?: string;
      location?: string;
      metadata?: any;
    }
  ): Promise<any> {
    return prisma.emailEvent.create({
      data: {
        emailRecipientId,
        type: eventData.type,
        bounceType: eventData.bounceType,
        bounceSubType: eventData.bounceSubType,
        complaintFeedbackType: eventData.complaintFeedbackType,
        userAgent: eventData.userAgent,
        ipAddress: eventData.ipAddress,
        location: eventData.location,
        metadata: eventData.metadata ? JSON.parse(JSON.stringify(eventData.metadata)) : null,
      },
    });
  }
}
