import { Injectable } from '@nestjs/common';
import { DomainStatus, Prisma } from '@prisma/client';
import prisma from '../common/prisma';
import { CreateDomainData, CreateDnsRecordData, FindDomainsWithFilterData, DomainWithDnsRecordsData } from './entities/domain.entity';

@Injectable()
export class DomainRepository {
  /**
   * Create a new domain with DNS records
   */
  async createDomain(data: CreateDomainData): Promise<any> {
    return prisma.domain.create({
      data: {
        name: data.name,
        createdBy: data.createdBy,
        teamId: data.teamId,
        status: data.status,
        region: data.region,
        clickTracking: data.clickTracking,
        openTracking: data.openTracking,
        tlsMode: data.tlsMode,
      },
    });
  }

  /**
   * Create DNS records for a domain
   */
  async createDnsRecords(domainId: number, records: CreateDnsRecordData[]): Promise<void> {
    await prisma.dnsRecord.createMany({
      data: records.map((record) => ({
        domainId,
        type: record.type,
        name: record.name,
        recordType: record.recordType,
        value: record.value,
        priority: record.priority,
        status: DomainStatus.pending,
      })),
    });
  }

  /**
   * Find DNS records by domain ID
   */
  async findDnsRecordsByDomainId(domainId: number): Promise<any[]> {
    return prisma.dnsRecord.findMany({
      where: { domainId },
    });
  }

  /**
   * Find domain by ID
   */
  async findById(id: number): Promise<any | null> {
    return prisma.domain.findUnique({
      where: { id },
    });
  }

  /**
   * Find domain by name
   */
  async findByName(name: string): Promise<any | null> {
    return prisma.domain.findUnique({
      where: { name },
    });
  }

  /**
   * Find all domains for a team
   */
  async findByTeamId(teamId: number): Promise<any[]> {
    return prisma.domain.findMany({
      where: { teamId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Update domain
   */
  async update(id: number, data: any): Promise<any> {
    return prisma.domain.update({
      where: { id },
      data,
    });
  }

  /**
   * Update DNS record verification status
   */
  async updateDnsRecordStatus(
    recordId: number,
    status: DomainStatus
  ): Promise<any> {
    return prisma.dnsRecord.update({
      where: { id: recordId },
      data: {
        status,
      },
    });
  }

  /**
   * Update all DNS records for a domain
   */
  async updateDomainDnsRecordsStatus(
    domainId: number,
    status: DomainStatus
  ): Promise<any> {
    return prisma.dnsRecord.updateMany({
      where: { domainId },
      data: {
        status,
      },
    });
  }

  /**
   * Delete domain
   */
  async delete(id: number): Promise<void> {
    await prisma.domain.delete({
      where: { id },
    });
  }

  /**
   * Check if domain exists
   */
  async exists(name: string): Promise<boolean> {
    const count = await prisma.domain.count({
      where: { name },
    });
    return count > 0;
  }

  /**
   * Get domain count for a team
   */
  async countByTeamId(teamId: number): Promise<number> {
    return prisma.domain.count({
      where: { teamId },
    });
  }

  /**
   * Get verified domains for a team
   */
  async findVerifiedByTeamId(teamId: number): Promise<any[]> {
    return prisma.domain.findMany({
      where: {
        teamId,
        status: DomainStatus.verified,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Find all domains with unverified DNS records
   * Used by cron job to queue for verification
   */
  async findDomainsWithUnverifiedDnsRecords(): Promise<any[]> {
    return prisma.domain.findMany({
      where: {
        OR: [
          { status: DomainStatus.pending },
          { status: DomainStatus.failed },
        ],
      },
      include: {
        dnsRecords: {
          where: {
            OR: [
              { status: DomainStatus.pending },
              { status: DomainStatus.failed },
            ],
          },
        },
      },
    });
  }

  /**
   * Update DNS record with additional fields
   */
  async updateDnsRecord(id: number, data: any): Promise<any> {
    return prisma.dnsRecord.update({
      where: { id },
      data,
    });
  }

  /**
   * Find domains with filtering and pagination
   */
  async findWithFilter(filter: FindDomainsWithFilterData): Promise<{ data: any[]; total: number }> {
    const { teamId, keyword, status, region, offset = 0, limit = 10 } = filter;

    const whereClause = Prisma.sql`
      WHERE D.team_id = ${teamId}
      AND (
        D.name::text ILIKE CONCAT('%', ${keyword ?? ''}::text, '%')
        OR COALESCE(${keyword}, NULL) IS NULL
      )
      AND (
        CASE
          WHEN ${status} = 'pending' THEN D.status = 'pending'
          WHEN ${status} = 'verified' THEN D.status = 'verified'
          WHEN ${status} = 'failed' THEN D.status = 'failed'
          ELSE TRUE
        END
      )
      AND (
        D.region::text = ${region ?? ''}::text
        OR COALESCE(${region}, NULL) IS NULL
      )
    `;

    const query = Prisma.sql`
      SELECT
        D.id,
        D.name,
        D.status,
        D.region,
        D.created_at,
        D.updated_at
      FROM domains D
      ${whereClause}
      ORDER BY D.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    const countQuery = Prisma.sql`
      SELECT COUNT(*)::int
      FROM domains D
      ${whereClause}
    `;

    const [data, countResult] = await Promise.all([
      prisma.$queryRaw<any[]>(query),
      prisma.$queryRaw<[{ count: number }]>(countQuery),
    ]);

    return {
      data,
      total: countResult[0]?.count || 0,
    };
  }

  /**
   * Find domain with DNS records using raw SQL with JOINs
   */
  async findDomainWithDnsRecords(domainId: number): Promise<DomainWithDnsRecordsData | null> {
    const query = Prisma.sql`
      SELECT 
        D.id,
        D.name,
        D.status,
        D.region,
        D.click_tracking as "clickTracking",
        D.open_tracking as "openTracking",
        D.tls_mode as "tlsMode",
        D.created_at as "createdAt",
        D.updated_at as "updatedAt",
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', DR.id,
              'type', DR.type,
              'name', DR.name,
              'recordType', DR.record_type,
              'value', DR.value,
              'status', DR.status,
              'priority', DR.priority
            )
          ) FILTER (WHERE DR.id IS NOT NULL),
          '[]'::json
        ) as "dnsRecords"
      FROM domains D
      LEFT JOIN dns_records DR ON D.id = DR.domain_id
      WHERE D.id = ${domainId}
      GROUP BY D.id, D.name, D.status, D.region, D.click_tracking, D.open_tracking, D.tls_mode, D.created_at, D.updated_at
    `;

    const [result] = await prisma.$queryRaw<any[]>(query);

    return result;
  }
}
