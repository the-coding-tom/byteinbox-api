export class AudienceFilterDto {
  page?: number;
  limit?: number;
  type?: string;
  search?: string;
}

export class CreateAudienceDto {
  name: string;
}

export class CreateAudienceResponseDto {
  id: string;
  name: string;
}

export class GetAudienceResponseDto {
  id: string;
  name: string;
  createdAt: string;
}

export class GetAudiencesResponseDto {
  audiences: Array<{
    id: number;
    reference: string;
    name: string;
    type: string;
    contactCount: number;
    subscriberCount: number;
    unsubscriberCount: number;
    createdAt: string;
    updatedAt: string;
  }>;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class GetAudienceContactsResponseDto {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
  unsubscribed: boolean;
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
  unsubscribed?: boolean;
  tags?: string[];
  metadata?: Record<string, any>;
}

export class UpdateContactDto {
  unsubscribed?: boolean;
  firstName?: string;
  lastName?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export class CreateContactResponseDto {
  id: string;
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
  id: string;
}

export class DeleteContactResponseDto {
  contact: string;
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
    totalCustomers: number;
    totalSubscribers: number;
    totalUnsubscribers: number;
  };
}
