export class FindAudiencesWithFilterData {
  teamId: number;
  keyword?: string;
  type?: string;
  offset?: number;
  limit?: number;
}

export class CreateAudienceData {
  name: string;
  teamId: number;
  createdBy: number;
  type?: string;
}

export class AudienceData {
  id: string | number; // Can be reference (string) for API or database ID (number) for internal use
  reference?: string; // Public-facing CUID
  name: string;
  createdAt?: string;
}
