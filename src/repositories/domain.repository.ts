import { Injectable } from '@nestjs/common';
import { DomainStatus } from '@prisma/client';
import prisma from '../common/prisma';
import { CreateDomainData, CreateDnsRecordData } from './entities/domain.entity';

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
}
