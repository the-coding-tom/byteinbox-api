import { DomainStatus } from '@prisma/client';

export class CreateDomainData {
  name: string;
  createdBy: number;
  teamId: number;
  status?: DomainStatus;
  region?: string;
  clickTracking?: boolean;
  openTracking?: boolean;
  tlsMode?: string;
  dkimSelector?: string;
  dkimPublicKey?: string;
  dkimPrivateKey?: string;
}

export class CreateDnsRecordData {
  type: string;
  name: string;
  recordType: string;
  value: string;
  priority?: number;
}

export class FindDomainsWithFilterData {
  teamId: number;
  keyword?: string;
  status?: string;
  region?: string;
  offset?: number;
  limit?: number;
}

export class DnsRecordData {
  id: number;
  type: string;
  name: string;
  recordType: string;
  value: string;
  status: string;
  priority: number | null;
}

export class DomainWithDnsRecordsData {
  id: number;
  name: string;
  status: string;
  region: string;
  clickTracking: boolean;
  openTracking: boolean;
  tlsMode: string;
  createdAt: Date;
  updatedAt: Date;
  dnsRecords: DnsRecordData[];
}

