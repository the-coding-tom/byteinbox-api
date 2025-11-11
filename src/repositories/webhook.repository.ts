import { Injectable } from '@nestjs/common';
import { Prisma, WebhookStatus } from '@prisma/client';
import prisma from '../common/prisma';
import { CreateWebhookData, WebhookData, WebhookDetailsData, WebhookListData, UpdateWebhookData } from './entities/webhook.entity';

@Injectable()
export class WebhookRepository {
  /**
   * Create a new webhook
   */
  async create(data: CreateWebhookData, signingSecret: string): Promise<WebhookData> {

    const webhook = await prisma.webhook.create({
      data: {
        url: data.url,
        events: data.events,
        teamId: data.teamId,
        createdBy: data.createdBy,
        secret: signingSecret,
        status: WebhookStatus.enabled,
      },
    });

    return {
      id: webhook.reference,
      signingSecret: webhook.secret,
    };
  }

  /**
   * Find a webhook by reference
   */
  async findByReference(reference: string, teamId: number): Promise<WebhookDetailsData | null> {
    const query = Prisma.sql`
      SELECT
        w.reference AS id,
        w.created_at::text AS "createdAt",
        w.status,
        w.url AS endpoint,
        w.events,
        w.secret AS "signingSecret"
      FROM webhooks w
      WHERE w.reference = ${reference}
        AND w.team_id = ${teamId}
    `;

    const webhooks: WebhookDetailsData[] = await prisma.$queryRaw(query);
    return webhooks.length > 0 ? webhooks[0] : null;
  }

  /**
   * Find all webhooks by team ID
   */
  async findAll(teamId: number): Promise<WebhookListData[]> {
    const query = Prisma.sql`
      SELECT
        w.reference AS id,
        w.created_at::text AS "createdAt",
        w.status,
        w.url AS endpoint,
        w.events
      FROM webhooks w
      WHERE w.team_id = ${teamId}
      ORDER BY w.created_at DESC
    `;

    const webhooks: WebhookListData[] = await prisma.$queryRaw(query);
    return webhooks;
  }

  /**
   * Update a webhook
   */
  async update(reference: string, teamId: number, data: UpdateWebhookData): Promise<{ id: string }> {
    const updateData: any = {};

    if (data.url !== undefined) {
      updateData.url = data.url;
    }

    if (data.events !== undefined) {
      updateData.events = data.events;
    }

    if (data.status !== undefined) {
      updateData.status = data.status as WebhookStatus;
    }

    const webhook = await prisma.webhook.update({
      where: {
        reference,
        teamId,
      },
      data: updateData,
      select: {
        reference: true,
      },
    });

    return {
      id: webhook.reference,
    };
  }

  /**
   * Delete a webhook
   */
  async delete(reference: string, teamId: number): Promise<{ id: string }> {
    const webhook = await prisma.webhook.delete({
      where: {
        reference,
        teamId,
      },
      select: {
        reference: true,
      },
    });

    return {
      id: webhook.reference,
    };
  }

  /**
   * Find active webhooks for a team that are subscribed to a specific event type
   */
  async findActiveByTeamAndEvent(teamId: number, eventType: string): Promise<any[]> {
    return prisma.webhook.findMany({
      where: {
        teamId,
        status: WebhookStatus.enabled,
        events: {
          has: eventType,
        },
      },
      select: {
        id: true,
        reference: true,
        url: true,
        secret: true,
        events: true,
      },
    });
  }

  /**
   * Update webhook last triggered timestamp
   */
  async updateLastTriggered(webhookId: number): Promise<void> {
    await prisma.webhook.update({
      where: { id: webhookId },
      data: { lastTriggered: new Date() },
    });
  }

  /**
   * Disable webhook (called after repeated failures)
   */
  async disable(webhookId: number): Promise<void> {
    await prisma.webhook.update({
      where: { id: webhookId },
      data: { status: WebhookStatus.disabled },
    });
  }

  /**
   * Create a webhook delivery record
   */
  async createDelivery(data: {
    webhookId: number;
    eventType: string;
    messageId?: string;
    status: string;
    request: any;
    response?: any;
    attempts: number;
  }): Promise<number> {
    const delivery = await prisma.webhookDelivery.create({
      data: {
        webhookId: data.webhookId,
        eventType: data.eventType,
        messageId: data.messageId,
        status: data.status as any,
        request: data.request,
        response: data.response,
        attempts: data.attempts,
        completedAt: data.status !== 'attempting' ? new Date() : null,
      },
      select: {
        id: true,
      },
    });

    return delivery.id;
  }

  /**
   * Update webhook delivery record
   */
  async updateDelivery(deliveryId: number, data: {
    status: string;
    response?: any;
    attempts: number;
  }): Promise<void> {
    await prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: data.status as any,
        response: data.response,
        attempts: data.attempts,
        completedAt: new Date(),
      },
    });
  }

  /**
   * Count recent failed deliveries for a webhook (within last hour)
   */
  async countRecentFailures(webhookId: number): Promise<number> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    return prisma.webhookDelivery.count({
      where: {
        webhookId,
        status: 'fail',
        createdAt: {
          gte: oneHourAgo,
        },
      },
    });
  }
}
