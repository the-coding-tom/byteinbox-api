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

