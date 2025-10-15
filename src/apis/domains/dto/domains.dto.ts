export class AddDomainDto {
  domainName: string;
  region: string;
}

export class GetDomainsFilterDto {
  keyword?: string; // Search by domain name
  status?: string;  // Filter by status (pending, verified, failed)
  region?: string;  // Filter by AWS region
  offset?: number;  // Pagination offset
  limit?: number;   // Pagination limit
}

export class AddDomainResponseDto {
  domain: {
    id: string;
    domainName: string;
    region: string;
    status: string;
    createdAt: string;
    dnsRecords: Array<{
      type: string;
      name: string;
      value: string;
      status: string;
    }>;
  };
}

export class GetDomainsResponseDto {
  domains: Array<{
    id: string;
    name: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  }>;
  meta?: {
    total: number;
    offset: number;
    limit: number;
  };
}

export class GetDomainDetailsResponseDto {
  domain: {
    id: string;
    name: string;
    status: string;
    region?: string;
    clickTracking: boolean;
    openTracking: boolean;
    tlsMode: string;
    createdAt: string;
    updatedAt: string;
    dnsRecords: Array<{
      id: string;
      type: string;
      name: string;
      recordType: string;
      value: string;
      status: string;
      priority?: number;
    }>;
  };
}

export class UpdateDomainDto {
  name?: string;
  region?: string;
  clickTracking?: boolean;
  openTracking?: boolean;
  tlsMode?: string;
}

export class UpdateDomainResponseDto {
  domain: {
    id: string;
    name: string;
    status: string;
    region?: string;
    clickTracking: boolean;
    openTracking: boolean;
    tlsMode: string;
    createdAt: string;
    updatedAt: string;
  };
}

export class VerifyDomainDto {
  // No body needed for verification
}

export class VerifyDomainResponseDto {
  message: string;
  domain: {
    id: string;
    name: string;
    status: string;
    verifiedAt: string;
  };
}

export class DeleteDomainResponseDto {
  message: string;
}

export class GetRegionsResponseDto {
  regions: Array<{
    id: string;
    name: string;
    location: string;
    available: boolean;
  }>;
}

export class UpdateDomainConfigurationDto {
  clickTracking?: boolean;
  openTracking?: boolean;
  tlsMode?: string;
}

export class UpdateDomainConfigurationResponseDto {
  domain: {
    id: string;
    name: string;
    clickTracking: boolean;
    openTracking: boolean;
    tlsMode: string;
    updatedAt: string;
  };
}

export class RestartDomainResponseDto {
  message: string;
  domain: {
    id: string;
    name: string;
    status: string;
    restartedAt: string;
  };
}
