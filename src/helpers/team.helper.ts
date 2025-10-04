import { generateSlug } from '../utils/string.util';
import { logInfoMessage } from '../utils/logger';

// Team Business Logic Functions

/**
 * Create a default team for a new user
 * This is called automatically when a user registers
 */
export async function createDefaultTeamForUser(
  userId: number, 
  userEmail: string,
  teamRepository: any,
  userRepository: any
): Promise<any> {
  try {
    // Generate a unique team name based on user's email
    const emailPrefix = userEmail.split('@')[0];
    const teamName = `${emailPrefix}'s Team`;
    
    // Generate a unique slug
    const baseSlug = generateSlug(teamName);
    const slug = await generateUniqueSlug(baseSlug, teamRepository);

    // Create the default team
    const team = await teamRepository.create({
      name: teamName,
      description: 'Your default team for managing API keys and resources',
      slug,
      isDefault: true,
      isPublic: false,
      createdBy: userId,
    });

    // Add the user as the team owner
    await teamRepository.addMember({
      teamId: team.id,
      userId,
      role: 'OWNER',
      status: 'ACTIVE',
      joinedAt: new Date(),
    });

    logInfoMessage(`Default team created for user ${userId}: ${team.name}`);

    return team;
  } catch (error) {
    logInfoMessage(`Error creating default team for user ${userId}: ${error.message}`);
    throw error;
  }
}

/**
 * Generate a unique slug for team
 */
async function generateUniqueSlug(baseSlug: string, teamRepository: any): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (await teamRepository.findBySlug(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

/**
 * Check if user has access to a team
 */
export async function hasTeamAccess(
  userId: number, 
  teamId: number, 
  requiredRole: string | undefined,
  teamRepository: any
): Promise<boolean> {
  const member = await teamRepository.findMember(teamId, userId);
  
  if (!member || member.status !== 'ACTIVE') {
    return false;
  }

  if (requiredRole) {
    return hasRolePermission(member.role, requiredRole);
  }

  return true;
}

/**
 * Check if a role has permission for a required role
 */
function hasRolePermission(userRole: string, requiredRole: string): boolean {
  const roleHierarchy = {
    'OWNER': 4,
    'ADMIN': 3,
    'EDITOR': 2,
    'MEMBER': 1,
    'GUEST': 0,
  };

  return (roleHierarchy as any)[userRole] >= (roleHierarchy as any)[requiredRole];
}

/**
 * Get all teams for a user
 */
export async function getUserTeams(userId: number, teamRepository: any): Promise<any[]> {
  return await teamRepository.findUserTeams(userId);
}

/**
 * Get team members (only for users with access)
 */
export async function getTeamMembers(
  teamId: number, 
  userId: number, 
  teamRepository: any
): Promise<any[]> {
  // Check if user has access to the team
  const hasAccess = await hasTeamAccess(userId, teamId, undefined, teamRepository);
  if (!hasAccess) {
    throw new Error('Access denied to team');
  }

  return await teamRepository.findTeamMembers(teamId);
}

/**
 * Invite a user to a team
 */
export async function inviteUserToTeam(
  teamId: number,
  inviterId: number,
  email: string,
  role: string = 'MEMBER',
  teamRepository: any,
  userRepository: any
): Promise<any> {
  // Check if inviter has admin permissions
  const hasAccess = await hasTeamAccess(inviterId, teamId, 'ADMIN', teamRepository);
  if (!hasAccess) {
    throw new Error('Insufficient permissions to invite users');
  }

  // Check if user exists
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new Error('User not found');
  }

  // Check if user is already a member
  const existingMember = await teamRepository.findMember(teamId, user.id);
  if (existingMember) {
    throw new Error('User is already a member of this team');
  }

  // Create invitation
  const invitation = await teamRepository.createInvitation({
    teamId,
    invitedUserId: user.id,
    invitedBy: inviterId,
    role,
    status: 'PENDING',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });

  logInfoMessage(`Team invitation sent: ${email} to team ${teamId}`);

  return invitation;
}

/**
 * Accept a team invitation
 */
export async function acceptTeamInvitation(
  token: string, 
  userId: number,
  teamRepository: any
): Promise<any> {
  const invitation = await teamRepository.findInvitationByToken(token);
  
  if (!invitation) {
    throw new Error('Invalid invitation token');
  }

  if (invitation.invitedUserId !== userId) {
    throw new Error('Invitation token does not match user');
  }

  if (invitation.status !== 'PENDING') {
    throw new Error('Invitation has already been used or expired');
  }

  if (invitation.expiresAt < new Date()) {
    throw new Error('Invitation has expired');
  }

  // Add user to team
  await teamRepository.addMember({
    teamId: invitation.teamId,
    userId: invitation.invitedUserId,
    role: invitation.role,
    status: 'ACTIVE',
    joinedAt: new Date(),
  });

  // Mark invitation as accepted
  await teamRepository.updateInvitation(invitation.id, { status: 'ACCEPTED' });

  logInfoMessage(`Team invitation accepted: user ${userId} joined team ${invitation.teamId}`);

  return { success: true, teamId: invitation.teamId };
}

/**
 * Remove a user from a team
 */
export async function removeUserFromTeam(
  teamId: number, 
  adminId: number, 
  memberId: number,
  teamRepository: any
): Promise<any> {
  // Check if admin has sufficient permissions
  const hasAccess = await hasTeamAccess(adminId, teamId, 'ADMIN', teamRepository);
  if (!hasAccess) {
    throw new Error('Insufficient permissions to remove users');
  }

  // Check if member exists
  const member = await teamRepository.findMember(teamId, memberId);
  if (!member) {
    throw new Error('Member not found in team');
  }

  // Prevent removing team owner
  if (member.role === 'OWNER') {
    throw new Error('Cannot remove team owner');
  }

  // Remove member
  await teamRepository.removeMember(teamId, memberId);

  logInfoMessage(`User ${memberId} removed from team ${teamId} by admin ${adminId}`);

  return { success: true };
}

/**
 * Update a team member's role
 */
export async function updateTeamMemberRole(
  teamId: number,
  adminId: number,
  memberId: number,
  newRole: string,
  teamRepository: any
): Promise<any> {
  // Check if admin has sufficient permissions
  const hasAccess = await hasTeamAccess(adminId, teamId, 'ADMIN', teamRepository);
  if (!hasAccess) {
    throw new Error('Insufficient permissions to update roles');
  }

  // Check if member exists
  const member = await teamRepository.findMember(teamId, memberId);
  if (!member) {
    throw new Error('Member not found in team');
  }

  // Prevent changing team owner's role
  if (member.role === 'OWNER') {
    throw new Error('Cannot change team owner role');
  }

  // Update role
  await teamRepository.updateMemberRole(teamId, memberId, newRole);

  logInfoMessage(`User ${memberId} role updated to ${newRole} in team ${teamId} by admin ${adminId}`);

  return { success: true, newRole };
} 