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

export class ContactFilterDto {
  page?: number;
  limit?: number;
  status?: string;
  tags?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export class CreateContactDto {
  email: string;
  firstName?: string;
  lastName?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export class UpdateContactDto {
  firstName?: string;
  lastName?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export class CreateContactResponseDto {
  contact: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    status: string;
    subscribedAt?: string;
    lastActivity?: string;
    tags: string[];
    metadata?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
  };
}

export class GetContactDetailsResponseDto {
  contact: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    status: string;
    subscribedAt?: string;
    lastActivity?: string;
    tags: string[];
    metadata?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
  };
}

export class UpdateContactResponseDto {
  contact: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    status: string;
    subscribedAt?: string;
    lastActivity?: string;
    tags: string[];
    metadata?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
  };
}

export class DeleteContactResponseDto {
  message: string;
}

export class UnsubscribeContactResponseDto {
  message: string;
  contact: {
    id: string;
    email: string;
    status: string;
    unsubscribedAt: string;
  };
}

export class GetContactStatsResponseDto {
  stats: {
    total: number;
    subscribed: number;
    unsubscribed: number;
    bounced: number;
    newThisMonth: number;
    activeThisMonth: number;
  };
}
