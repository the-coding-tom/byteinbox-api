export class AudienceFilterDto {
  page?: number;
  limit?: number;
  type?: string;
  search?: string;
}

export class GetAudiencesResponseDto {
  audiences: Array<{
    id: string;
    name: string;
    type: string;
    contactCount: number;
    createdAt: string;
    updatedAt: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class GetAudienceContactsResponseDto {
  contacts: Array<{
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    status: string;
    subscribedAt?: string;
    lastActivity?: string;
    tags: string[];
    createdAt: string;
    updatedAt: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class GetAudienceStatusesResponseDto {
  statuses: Array<{
    value: string;
    label: string;
    count: number;
  }>;
}
