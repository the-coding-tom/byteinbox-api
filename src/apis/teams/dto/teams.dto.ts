// Create Team DTO
export class CreateTeamDto {
  name: string;
  description?: string;
  isPublic?: boolean;
}

// Update Team DTO
export class UpdateTeamDto {
  name?: string;
  description?: string;
  isPublic?: boolean;
}

// Invite Team Member DTO
export class InviteTeamMemberDto {
  email: string;
  role: string;
}

// Update Team Member Role DTO
export class UpdateTeamMemberRoleDto {
  role: string;
}