export class TeamEntity {
  id: number;
  name: string;
  description?: string;
  slug: string;
  isDefault: boolean;
  isPublic: boolean;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}

export class TeamMemberEntity {
  id: number;
  teamId: number;
  userId: number;
  role: string;
  status: string;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
} 