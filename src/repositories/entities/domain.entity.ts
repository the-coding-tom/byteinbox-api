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
  record: string; // SPF, DKIM, DMARC, MX
  name: string; // send, send.marketing, byteinbox._domainkey, etc.
  type: string; // TXT, MX, CNAME
  value: string;
  ttl: string; // Auto or specific TTL
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
  record: string; // SPF, DKIM, DMARC, MX
  name: string; // send, send.marketing, byteinbox._domainkey, etc.
  type: string; // TXT, MX, CNAME
  value: string;
  ttl: string; // Auto or specific TTL
  status: string;
  priority: number | null;
  lastCheckedAt: Date | null;
}

export class DomainWithDnsRecordsData {
  id: number;
  name: string;
  status: string;
  region: string;
  clickTracking: boolean;
  openTracking: boolean;
  tlsMode: string;
  dkimSelector?: string;
  dkimPublicKey?: string;
  dkimPrivateKey?: string;
  createdAt: Date;
  updatedAt: Date;
  dnsRecords: DnsRecordData[];
}

export class DnsVerificationResult {
  verified: boolean;
  recordFound: boolean;
  expectedValue: string;
  actualValue?: string;
  error?: string;
}

