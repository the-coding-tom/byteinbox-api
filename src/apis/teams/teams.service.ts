import { Injectable, HttpStatus } from '@nestjs/common';
import { generateSuccessResponse, throwError } from '../../utils/util';
import { handleServiceError } from '../../utils/error.util';
import { Constants, TeamMemberRole } from '../../common/enums/generic.enum';
import { TeamRepository } from '../../repositories/team.repository';
import { UserRepository } from '../../repositories/user.repository';
import { TeamsValidator } from './teams.validator';
import { CreateTeamDto, UpdateTeamDto, InviteTeamMemberDto, UpdateTeamMemberRoleDto } from './dto/teams.dto';
import { generateSlug } from '../../utils/string.util';
import { logInfoMessage } from '../../utils/logger';

@Injectable()
export class TeamsService {
  constructor(
    private readonly teamRepository: TeamRepository,
    private readonly userRepository: UserRepository,
    private readonly teamsValidator: TeamsValidator,
  ) {}

  // TEAM CREATION & MANAGEMENT

  async createTeam(createDto: CreateTeamDto, userId: number): Promise<any> {
    try {
      // Validate input data
      const validatedData = await this.teamsValidator.validateCreateTeam(createDto);

      // Generate unique slug
      const baseSlug = generateSlug(validatedData.name);
      const slug = await this.generateUniqueSlug(baseSlug);

      // Create team
      const team = await this.teamRepository.create({
        name: validatedData.name,
        slug,
      });

      // Add user as team owner
      await this.teamRepository.addMember({
        teamId: team.id,
        userId,
        role: TeamMemberRole.owner,
      });

      // Log team creation
      logInfoMessage(`Team created: ${team.name} by user ${userId}`);

      return generateSuccessResponse({
        statusCode: HttpStatus.CREATED,
        message: Constants.createdSuccessfully,
        data: {
          id: team.id,
          reference: team.reference,
          name: team.name,
          slug: team.slug,
          image: team.image,
          createdAt: team.createdAt,
          userRole: 'OWNER',
        },
      });
    } catch (error) {
      return handleServiceError('Error creating team', error);
    }
  }

  async getUserTeams(userId: number): Promise<any> {
    try {
      // Validate user access
      await this.teamsValidator.validateGetUserTeams(userId);
      
      // Get user teams
      const teams = await this.teamRepository.findUserTeams(userId);

      // Format team data
      const formattedTeams = teams.map(team => ({
        id: team.id,
        reference: team.reference,
        name: team.name,
        slug: team.slug,
        image: team.image,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
        memberCount: team._count.members,
        apiKeyCount: team._count.apiKeys,
        userRole: team.members[0]?.role,
      }));

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.retrievedSuccessfully,
        data: formattedTeams,
      });
    } catch (error) {
      return handleServiceError('Error getting user teams', error);
    }
  }

  async getTeamApiKeys(teamId: string, userId: number): Promise<any> {
    try {
      // Validate team access
      const { teamId: validatedTeamId } = await this.teamsValidator.validateGetTeamApiKeys(teamId, userId, this.teamRepository);
      
      // Get team API keys
      const apiKeys = await this.teamRepository.findTeamApiKeys(validatedTeamId);

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.retrievedSuccessfully,
        data: apiKeys,
      });
    } catch (error) {
      return handleServiceError('Error getting team API keys', error);
    }
  }

  async getTeamDetails(teamId: string, userId: number): Promise<any> {
    try {
      // Validate team access
      const { teamId: validatedTeamId, team } = await this.teamsValidator.validateGetTeamDetails(teamId, userId, this.teamRepository);
      
      // Get team member info
      const member = await this.teamRepository.findMember(validatedTeamId, userId);

      // Format team data
      const formattedTeam = {
        id: team.id,
        reference: team.reference,
        name: team.name,
        slug: team.slug,
        image: team.image,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
        userRole: member?.role,
      };

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.retrievedSuccessfully,
        data: formattedTeam,
      });
    } catch (error) {
      return handleServiceError('Error getting team details', error);
    }
  }

  async updateTeam(teamId: string, updateDto: UpdateTeamDto, userId: number): Promise<any> {
    try {
      // Validate team access and update data
      const { teamId: validatedTeamId, validatedData } = await this.teamsValidator.validateUpdateTeam(teamId, userId, updateDto, this.teamRepository);
      
      // Update team
      const updatedTeam = await this.teamRepository.update(validatedTeamId, validatedData);

      // Log team update
      logInfoMessage(`Team updated: ${updatedTeam.name} by user ${userId}`);

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.updatedSuccessfully,
        data: {
          id: updatedTeam.id,
          reference: updatedTeam.reference,
          name: updatedTeam.name,
          slug: updatedTeam.slug,
          image: updatedTeam.image,
          updatedAt: updatedTeam.updatedAt,
        },
      });
    } catch (error) {
      return handleServiceError('Error updating team', error);
    }
  }

  async deleteTeam(teamId: string, userId: number): Promise<any> {
    try {
      // Validate team access and deletion permissions
      const { teamId: validatedTeamId, team } = await this.teamsValidator.validateDeleteTeam(teamId, userId, this.teamRepository);
      
      // Delete team
      await this.teamRepository.delete(validatedTeamId);

      // Log team deletion
      logInfoMessage(`Team deleted: ${validatedTeamId} by user ${userId}`);

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.deletedSuccessfully,
        data: { teamId: team.id },
      });
    } catch (error) {
      return handleServiceError('Error deleting team', error);
    }
  }

  // TEAM MEMBER MANAGEMENT

  async getTeamMembers(teamId: string, userId: number): Promise<any> {
    try {
      // Validate team access
      const { teamId: validatedTeamId } = await this.teamsValidator.validateGetTeamMembers(teamId, userId, this.teamRepository);
      
      // Get team members
      const members = await this.teamRepository.findTeamMembers(validatedTeamId);

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.retrievedSuccessfully,
        data: members,
      });
    } catch (error) {
      return handleServiceError('Error getting team members', error);
    }
  }

  async inviteTeamMember(teamId: string, inviteDto: InviteTeamMemberDto, userId: number): Promise<any> {
    try {
      // Validate team access and invitation data
      const { teamId: validatedTeamId, validatedData } = await this.teamsValidator.validateInviteTeamMember(teamId, userId, inviteDto, this.teamRepository);
      
      // Check if user already exists
      const existingUser = await this.userRepository.findByEmail(validatedData.email);
      
      if (existingUser) {
        // Check if user is already a member
        const existingMember = await this.teamRepository.findMember(validatedTeamId, existingUser.id);
        if (existingMember) {
          throwError('User is already a member of this team', HttpStatus.BAD_REQUEST, 'userAlreadyMember');
        }
      }

      // Create invitation
      const invitation = await this.teamRepository.createInvitation({
        teamId: validatedTeamId,
        email: validatedData.email,
        role: validatedData.role as TeamMemberRole,
        invitedBy: userId.toString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      // Log invitation creation
      logInfoMessage(`Team invitation created: ${validatedData.email} to team ${validatedTeamId} by user ${userId}`);

      return generateSuccessResponse({
        statusCode: HttpStatus.CREATED,
        message: Constants.successMessage,
        data: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          expiresAt: invitation.expiresAt,
        },
      });
    } catch (error) {
      return handleServiceError('Error inviting team member', error);
    }
  }

  async removeTeamMember(teamId: string, memberUserId: string, userId: number): Promise<any> {
    try {
      // Validate team access and removal permissions
      const { teamId: validatedTeamId, memberUserId: validatedMemberUserId, team } = await this.teamsValidator.validateRemoveTeamMember(teamId, memberUserId, userId, this.teamRepository);
      
      // Check if trying to remove the team owner
      const member = await this.teamRepository.findMember(validatedTeamId, validatedMemberUserId);
      if (member?.role === 'OWNER') {
        throwError('Cannot remove the team owner', HttpStatus.BAD_REQUEST, 'cannotRemoveOwner');
      }

      // Remove member
      await this.teamRepository.removeMember(validatedTeamId, validatedMemberUserId);

      // Log member removal
      logInfoMessage(`Team member removed: user ${validatedMemberUserId} from team ${validatedTeamId} by user ${userId}`);

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.deletedSuccessfully,
        data: {
          teamId: team.id,
          memberUserId,
        },
      });
    } catch (error) {
      return handleServiceError('Error removing team member', error);
    }
  }

  async updateTeamMemberRole(teamId: string, memberUserId: string, roleDto: UpdateTeamMemberRoleDto, userId: number): Promise<any> {
    try {
      // Validate team access and role update permissions
      const { teamId: validatedTeamId, memberUserId: validatedMemberUserId, validatedData, team } = await this.teamsValidator.validateUpdateTeamMemberRole(teamId, memberUserId, userId, roleDto, this.teamRepository);
      
      // Check if trying to change the team owner's role
      const member = await this.teamRepository.findMember(validatedTeamId, validatedMemberUserId);
      if (member?.role === TeamMemberRole.owner) {
        throwError('Cannot change the team owner\'s role', HttpStatus.BAD_REQUEST, 'cannotChangeOwnerRole');
      }

      // Update role
      await this.teamRepository.updateMemberRole(validatedTeamId, validatedMemberUserId, validatedData.role as TeamMemberRole);

      // Log role update
      logInfoMessage(`Team member role updated: user ${validatedMemberUserId} to ${validatedData.role} in team ${validatedTeamId} by user ${userId}`);

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.updatedSuccessfully,
        data: {
          teamId: team.id,
          memberUserId,
          role: validatedData.role,
        },
      });
    } catch (error) {
      return handleServiceError('Error updating team member role', error);
    }
  }

  // UTILITY METHODS

  private async generateUniqueSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    // Check if slug exists and generate unique one
    while (await this.teamRepository.findBySlug(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }
} 