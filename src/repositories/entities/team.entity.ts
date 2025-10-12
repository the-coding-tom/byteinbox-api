import { TeamMemberRole } from '../../common/enums/generic.enum';

export class CreateTeamData {
  name: string;
  slug: string;
}

export class AddTeamMemberData {
  teamId: number;
  userId: number;
  role: TeamMemberRole;
}

export class CreateTeamInvitationData {
  teamId: number;
  email: string;
  role: TeamMemberRole;
  invitedBy: string;
  expiresAt: Date;
}

export class CreateTeamApiKeyData {
  teamId: number;
  key: string;
  name: string;
  permission: string;
  domain?: string;
  createdBy?: number;
}
