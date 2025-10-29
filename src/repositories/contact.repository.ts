import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import prisma from '../common/prisma';
import { CreateContactData, ContactData, ContactListData, UpdateContactData } from './entities/contact.entity';
import { ContactStatus } from '@prisma/client';

@Injectable()
export class ContactRepository {
  /**
   * Create a new contact in an audience
   */
  async create(data: CreateContactData): Promise<ContactData> {
    const status = data.unsubscribed ? ContactStatus.unsubscribed : ContactStatus.subscribed;

    const contact = await prisma.contact.create({
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        status,
        subscribedAt: status === ContactStatus.subscribed ? new Date() : null,
        teamId: data.teamId,
        createdBy: data.createdBy,
        tags: data.tags || [],
        metadata: data.metadata,
        audienceContacts: {
          create: {
            audienceId: data.audienceId,
          },
        },
      },
      select: {
        reference: true,
      },
    });

    return {
      id: contact.reference,
    };
  }

  /**
   * Find contacts by audience ID
   */
  async findByAudienceId(audienceId: number, teamId: number): Promise<ContactListData[]> {
    const query = Prisma.sql`
      SELECT
        c.id,
        c.reference,
        c.email,
        c.first_name AS "firstName",
        c.last_name AS "lastName",
        c.created_at::text AS "createdAt",
        (c.status = 'unsubscribed')::boolean AS unsubscribed
      FROM contacts c
      INNER JOIN audience_contacts ac ON ac.contact_id = c.id
      WHERE c.team_id = ${teamId}
        AND ac.audience_id = ${audienceId}
      ORDER BY c.created_at DESC
    `;

    const contacts: ContactListData[] = await prisma.$queryRaw(query);
    return contacts;
  }

  /**
   * Find a single contact by reference
   */
  async findByReference(contactReference: string, audienceId: number, teamId: number): Promise<ContactListData | null> {
    const query = Prisma.sql`
      SELECT
        c.id,
        c.reference,
        c.email,
        c.first_name AS "firstName",
        c.last_name AS "lastName",
        c.created_at::text AS "createdAt",
        (c.status = 'unsubscribed')::boolean AS unsubscribed
      FROM contacts c
      INNER JOIN audience_contacts ac ON ac.contact_id = c.id
      WHERE c.team_id = ${teamId}
        AND c.reference = ${contactReference}
        AND ac.audience_id = ${audienceId}
    `;

    const contacts: ContactListData[] = await prisma.$queryRaw(query);
    return contacts.length > 0 ? contacts[0] : null;
  }

  /**
   * Find a single contact by reference or email
   */
  async findByReferenceOrEmail(identifier: string, audienceId: number, teamId: number): Promise<ContactListData | null> {
    const query = Prisma.sql`
      SELECT
        c.id,
        c.reference,
        c.email,
        c.first_name AS "firstName",
        c.last_name AS "lastName",
        c.created_at::text AS "createdAt",
        (c.status = 'unsubscribed')::boolean AS unsubscribed
      FROM contacts c
      INNER JOIN audience_contacts ac ON ac.contact_id = c.id
      WHERE c.team_id = ${teamId}
        AND (c.reference = ${identifier} OR c.email = ${identifier})
        AND ac.audience_id = ${audienceId}
    `;

    const contacts: ContactListData[] = await prisma.$queryRaw(query);
    return contacts.length > 0 ? contacts[0] : null;
  }

  /**
   * Update contact
   */
  async update(
    contactId: number,
    data: UpdateContactData,
  ): Promise<ContactData> {
    const contact = await prisma.contact.update({
      where: {
        id: contactId,
      },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        status: data.status as ContactStatus,
      },
      select: {
        reference: true,
      },
    });

    return {
      id: contact.reference,
    };
  }

  /**
   * Delete contact by ID
   */
  async delete(contactId: number): Promise<void> {
    await prisma.contact.delete({
      where: {
        id: contactId,
      },
    });
  }

  /**
   * Get contact statistics for an audience
   */
  async getStatsByAudience(audienceId: number, teamId: number): Promise<{
    totalCustomers: number;
    totalSubscribers: number;
    totalUnsubscribers: number;
  }> {
    const query = Prisma.sql`
      SELECT
        CAST((SELECT COUNT(c.id) FROM contacts c
              INNER JOIN audience_contacts ac ON ac.contact_id = c.id
              WHERE c.team_id = ${teamId}
              AND ac.audience_id = ${audienceId}
        ) AS INTEGER) AS "totalCustomers",
        CAST((SELECT COUNT(c.id) FROM contacts c
              INNER JOIN audience_contacts ac ON ac.contact_id = c.id
              WHERE c.team_id = ${teamId}
              AND ac.audience_id = ${audienceId}
              AND c.status::text = 'subscribed'
        ) AS INTEGER) AS "totalSubscribers",
        CAST((SELECT COUNT(c.id) FROM contacts c
              INNER JOIN audience_contacts ac ON ac.contact_id = c.id
              WHERE c.team_id = ${teamId}
              AND ac.audience_id = ${audienceId}
              AND c.status::text = 'unsubscribed'
        ) AS INTEGER) AS "totalUnsubscribers"
    `;

    const result = await prisma.$queryRaw<Array<{
      totalCustomers: number;
      totalSubscribers: number;
      totalUnsubscribers: number;
    }>>(query);

    return result[0];
  }
}
