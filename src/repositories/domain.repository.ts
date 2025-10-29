import { Injectable } from '@nestjs/common';
import { DomainStatus, Prisma } from '@prisma/client';
import prisma from '../common/prisma';
import { CreateDomainData, CreateDnsRecordData, FindDomainsWithFilterData, DomainWithDnsRecordsData } from './entities/domain.entity';

@Injectable()
export class DomainRepository {
  /**
   * Create a new domain with DNS records in a single atomic transaction
   */
  async createDomainWithDnsRecords(domainData: CreateDomainData, dnsRecords: CreateDnsRecordData[]): Promise<any> {
    return prisma.domain.create({
      data: {
        name: domainData.name,
        createdBy: domainData.createdBy,
        teamId: domainData.teamId,
        status: domainData.status,
        region: domainData.region,
        clickTracking: domainData.clickTracking,
        openTracking: domainData.openTracking,
        tlsMode: domainData.tlsMode,
        dkimSelector: domainData.dkimSelector,
        dkimPublicKey: domainData.dkimPublicKey,
        dkimPrivateKey: domainData.dkimPrivateKey,
        dnsRecords: {
          createMany: {
            data: dnsRecords.map((record) => ({
              type: record.type,
              name: record.name,
              recordType: record.recordType,
              value: record.value,
              priority: record.priority,
              status: DomainStatus.pending_dns,
            })),
          },
        },
      },
      include: {
        dnsRecords: true,
      },
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
   * Find domain by ID with DNS records
   */
  async findById(id: number): Promise<any | null> {
    return prisma.domain.findUnique({
      where: { id },
      include: {
        dnsRecords: true,
      },
    });
  }

  /**
   * Find domain by name (returns first match since name is no longer unique)
   */
  async findByName(name: string): Promise<any | null> {
    return prisma.domain.findFirst({
      where: { name },
    });
  }

  /**
   * Find domain by team ID and name
   */
  async findByTeamIdAndName(teamId: number, name: string): Promise<any | null> {
    return prisma.domain.findFirst({
      where: { 
        teamId,
        name 
      },
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
   * Find all domains with pending DNS verification
   * Used by DNS verification cron job
   */
  async findDomainsWithPendingDns(): Promise<any[]> {
    return prisma.domain.findMany({
      where: {
        OR: [
          { status: DomainStatus.pending_dns },
          { status: DomainStatus.failed },
        ],
      },
      include: {
        dnsRecords: true,
      },
    });
  }

  /**
   * Find all domains with pending AWS verification
   * Used by AWS verification cron job
   */
  async findDomainsWithPendingAws(): Promise<any[]> {
    return prisma.domain.findMany({
      where: {
        status: DomainStatus.pending_aws,
      },
      include: {
        dnsRecords: true,
      },
    });
  }

  /**
   * Find domains by status
   */
  async findByStatus(status: DomainStatus): Promise<any[]> {
    return prisma.domain.findMany({
      where: { status },
      include: {
        dnsRecords: true,
      },
    });
  }

  /**
   * Find verified domain by name (globally)
   */
  async findVerifiedByName(name: string): Promise<any | null> {
    return prisma.domain.findFirst({
      where: {
        name,
        status: DomainStatus.verified,
      },
    });
  }

  /**
   * Create domain ownership history record
   */
  async createOwnershipHistory(data: {
    domainId: number;
    domainName: string;
    previousTeamId: number | null;
    newTeamId: number;
    transferReason?: string;
    metadata?: any;
  }): Promise<any> {
    return prisma.domainOwnershipHistory.create({
      data: {
        domainId: data.domainId,
        domainName: data.domainName,
        previousTeamId: data.previousTeamId,
        newTeamId: data.newTeamId,
        transferReason: data.transferReason || 'dns_verification',
        metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : null,
      },
    });
  }

  /**
   * Get ownership history for a domain
   */
  async getOwnershipHistory(domainId: number): Promise<any[]> {
    return prisma.domainOwnershipHistory.findMany({
      where: { domainId },
      orderBy: {
        createdAt: 'desc',
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
  async findWithFilter(filter: FindDomainsWithFilterData): Promise<{ data: any[]; total: number; offset: number; limit: number }> {
    const { teamId, keyword, status, region, offset = 0, limit = 10 } = filter;

    const whereClause = Prisma.sql`
      WHERE D.team_id = ${teamId}
      AND (
        D.name::text ILIKE CONCAT('%', ${keyword ?? ''}::text, '%')
        OR COALESCE(${keyword}, NULL) IS NULL
      )
      AND (
        CASE
          WHEN ${status} = 'pending_dns' THEN D.status = 'pending_dns'
          WHEN ${status} = 'dns_verified' THEN D.status = 'dns_verified'
          WHEN ${status} = 'pending_aws' THEN D.status = 'pending_aws'
          WHEN ${status} = 'verified' THEN D.status = 'verified'
          WHEN ${status} = 'failed' THEN D.status = 'failed'
          WHEN ${status} = 'revoked' THEN D.status = 'revoked'
          ELSE TRUE
        END
      )
      AND (
        D.region::text = ${region ?? ''}::text
        OR COALESCE(${region}, NULL) IS NULL
      )
    `;

    const retrieveDomainsQuery = Prisma.sql`
      SELECT
        D.id,
        D.name,
        D.status,
        D.created_at::text as "createdAt",
        D.updated_at::text as "updatedAt"
      FROM domains D
      ${whereClause}
      ORDER BY D.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    const countDomainsQuery = Prisma.sql`
      SELECT COUNT(*)::int
      FROM domains D
      ${whereClause}
    `;

    const domains: any[] = await prisma.$queryRaw(retrieveDomainsQuery);
    const [{ count }]: { count: number }[] = await prisma.$queryRaw(countDomainsQuery);

    return {
      data: domains,
      total: count,
      offset,
      limit,
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

  /**
   * Reset all other domains with the same name (except current domain) to pending_dns
   * This forces other teams to re-verify DNS when a domain is taken over
   */
  async resetOtherDomainsToVerifying(currentDomainId: number, domainName: string): Promise<void> {
    await prisma.domain.updateMany({
      where: {
        name: domainName,
        id: { not: currentDomainId },
      },
      data: {
        status: DomainStatus.pending_dns,
      },
    });
  }
}
