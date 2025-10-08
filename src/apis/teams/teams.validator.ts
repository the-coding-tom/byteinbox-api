import { Injectable, HttpStatus } from '@nestjs/common';
import * as Joi from 'joi';
import { validateJoiSchema } from '../../utils/joi.validator';
import { throwError } from '../../utils/util';
import { CreateTeamDto, UpdateTeamDto, InviteTeamMemberDto, UpdateTeamMemberRoleDto } from './dto/teams.dto';

@Injectable()
export class TeamsValidator {
  // TEAM CREATION VALIDATION

  async validateCreateTeam(data: CreateTeamDto): Promise<CreateTeamDto> {
    // Validate input schema
    const schema = Joi.object({
      name: Joi.string().min(1).max(100).required().messages({
        'string.empty': 'Team name is required',
        'string.min': 'Team name must be at least 1 character long',
        'string.max': 'Team name must not exceed 100 characters',
        'any.required': 'Team name is required',
      }),
      description: Joi.string().max(500).optional().messages({
        'string.max': 'Team description must not exceed 500 characters',
      }),
      isPublic: Joi.boolean().optional(),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');
    
    return data;
  }

  // TEAM ACCESS VALIDATION

  async validateGetUserTeams(userId: number): Promise<void> {
    // Validate user ID
    const schema = Joi.object({
      userId: Joi.number().integer().positive().required(),
    });
    
    const error = validateJoiSchema(schema, { userId });
    if (error) throwError('Invalid user ID', HttpStatus.BAD_REQUEST, 'validationError');
  }

  async validateGetTeamApiKeys(teamId: string, userId: number, teamRepository: any): Promise<{ teamId: number; team: any }> {
    // Validate team ID
    const teamIdSchema = Joi.object({
      teamId: Joi.number().integer().positive().required(),
    });
    const teamIdError = validateJoiSchema(teamIdSchema, { teamId: parseInt(teamId) });
    if (teamIdError) throwError('Invalid team ID', HttpStatus.BAD_REQUEST, 'validationError');
    
    const validatedTeamId = parseInt(teamId);

    // Validate user ID
    const userIdSchema = Joi.object({
      userId: Joi.number().integer().positive().required(),
    });
    const userIdError = validateJoiSchema(userIdSchema, { userId });
    if (userIdError) throwError('Invalid user ID', HttpStatus.BAD_REQUEST, 'validationError');

    // Validate team exists and user has access
    const team = await teamRepository.findById(validatedTeamId);
    if (!team) {
      throwError('Team not found', HttpStatus.NOT_FOUND, 'teamNotFound');
    }

    const teamMember = await teamRepository.findTeamMember(validatedTeamId, userId);
    if (!teamMember) {
      throwError('Access denied', HttpStatus.FORBIDDEN, 'accessDenied');
    }

    return { teamId: validatedTeamId, team };
  }

  async validateGetTeamDetails(teamId: string, userId: number, teamRepository: any): Promise<{ teamId: number; team: any }> {
    // Validate team ID
    const teamIdSchema = Joi.object({
      teamId: Joi.number().integer().positive().required(),
    });
    const teamIdError = validateJoiSchema(teamIdSchema, { teamId: parseInt(teamId) });
    if (teamIdError) throwError('Invalid team ID', HttpStatus.BAD_REQUEST, 'validationError');
    
    const validatedTeamId = parseInt(teamId);

    // Validate user ID
    const userIdSchema = Joi.object({
      userId: Joi.number().integer().positive().required(),
    });
    const userIdError = validateJoiSchema(userIdSchema, { userId });
    if (userIdError) throwError('Invalid user ID', HttpStatus.BAD_REQUEST, 'validationError');

    // Validate team exists and user has access
    const team = await teamRepository.findById(validatedTeamId);
    if (!team) {
      throwError('Team not found', HttpStatus.NOT_FOUND, 'teamNotFound');
    }

    const teamMember = await teamRepository.findTeamMember(validatedTeamId, userId);
    if (!teamMember) {
      throwError('Access denied', HttpStatus.FORBIDDEN, 'accessDenied');
    }

    return { teamId: validatedTeamId, team };
  }

  // TEAM MANAGEMENT VALIDATION

  async validateUpdateTeam(teamId: string, userId: number, data: UpdateTeamDto, teamRepository: any): Promise<{ teamId: number; validatedData: UpdateTeamDto; team: any }> {
    // Validate team ID
    const teamIdSchema = Joi.object({
      teamId: Joi.number().integer().positive().required(),
    });
    const teamIdError = validateJoiSchema(teamIdSchema, { teamId: parseInt(teamId) });
    if (teamIdError) throwError('Invalid team ID', HttpStatus.BAD_REQUEST, 'validationError');
    
    const validatedTeamId = parseInt(teamId);

    // Validate user ID
    const userIdSchema = Joi.object({
      userId: Joi.number().integer().positive().required(),
    });
    const userIdError = validateJoiSchema(userIdSchema, { userId });
    if (userIdError) throwError('Invalid user ID', HttpStatus.BAD_REQUEST, 'validationError');

    // Validate update data
    const updateSchema = Joi.object({
      name: Joi.string().min(1).max(100).optional().messages({
        'string.empty': 'Team name cannot be empty',
        'string.min': 'Team name must be at least 1 character long',
        'string.max': 'Team name must not exceed 100 characters',
      }),
      description: Joi.string().max(500).optional().messages({
        'string.max': 'Team description must not exceed 500 characters',
      }),
      isPublic: Joi.boolean().optional(),
    });

    const updateError = validateJoiSchema(updateSchema, data);
    if (updateError) throwError(updateError, HttpStatus.BAD_REQUEST, 'validationError');

    // Validate team exists and user has access
    const team = await teamRepository.findById(validatedTeamId);
    if (!team) {
      throwError('Team not found', HttpStatus.NOT_FOUND, 'teamNotFound');
    }

    const teamMember = await teamRepository.findTeamMember(validatedTeamId, userId);
    if (!teamMember) {
      throwError('Access denied', HttpStatus.FORBIDDEN, 'accessDenied');
    }

    // Check if user has permission to update team
    if (!this.hasRolePermission(teamMember.role, 'ADMIN')) {
      throwError('Insufficient permissions to update team', HttpStatus.FORBIDDEN, 'insufficientPermissions');
    }

    return { teamId: validatedTeamId, validatedData: data, team };
  }

  async validateDeleteTeam(teamId: string, userId: number, teamRepository: any): Promise<{ teamId: number; team: any }> {
    // Validate team ID
    const teamIdSchema = Joi.object({
      teamId: Joi.number().integer().positive().required(),
    });
    const teamIdError = validateJoiSchema(teamIdSchema, { teamId: parseInt(teamId) });
    if (teamIdError) throwError('Invalid team ID', HttpStatus.BAD_REQUEST, 'validationError');
    
    const validatedTeamId = parseInt(teamId);

    // Validate user ID
    const userIdSchema = Joi.object({
      userId: Joi.number().integer().positive().required(),
    });
    const userIdError = validateJoiSchema(userIdSchema, { userId });
    if (userIdError) throwError('Invalid user ID', HttpStatus.BAD_REQUEST, 'validationError');

    // Validate team exists and user has access
    const team = await teamRepository.findById(validatedTeamId);
    if (!team) {
      throwError('Team not found', HttpStatus.NOT_FOUND, 'teamNotFound');
  }

    const teamMember = await teamRepository.findTeamMember(validatedTeamId, userId);
    if (!teamMember) {
      throwError('Access denied', HttpStatus.FORBIDDEN, 'accessDenied');
    }

    // Check if user has permission to delete team
    if (!this.hasRolePermission(teamMember.role, 'OWNER')) {
      throwError('Only team owner can delete the team', HttpStatus.FORBIDDEN, 'insufficientPermissions');
    }

    return { teamId: validatedTeamId, team };
  }

  // TEAM MEMBER VALIDATION

  async validateGetTeamMembers(teamId: string, userId: number, teamRepository: any): Promise<{ teamId: number; team: any }> {
    // Validate team ID
    const teamIdSchema = Joi.object({
      teamId: Joi.number().integer().positive().required(),
    });
    const teamIdError = validateJoiSchema(teamIdSchema, { teamId: parseInt(teamId) });
    if (teamIdError) throwError('Invalid team ID', HttpStatus.BAD_REQUEST, 'validationError');
    
    const validatedTeamId = parseInt(teamId);

    // Validate user ID
    const userIdSchema = Joi.object({
      userId: Joi.number().integer().positive().required(),
    });
    const userIdError = validateJoiSchema(userIdSchema, { userId });
    if (userIdError) throwError('Invalid user ID', HttpStatus.BAD_REQUEST, 'validationError');

    // Validate team exists and user has access
    const team = await teamRepository.findById(validatedTeamId);
    if (!team) {
      throwError('Team not found', HttpStatus.NOT_FOUND, 'teamNotFound');
    }

    const teamMember = await teamRepository.findTeamMember(validatedTeamId, userId);
    if (!teamMember) {
      throwError('Access denied', HttpStatus.FORBIDDEN, 'accessDenied');
    }

    return { teamId: validatedTeamId, team };
  }

  async validateInviteTeamMember(teamId: string, userId: number, data: InviteTeamMemberDto, teamRepository: any): Promise<{ teamId: number; validatedData: InviteTeamMemberDto; team: any }> {
    // Validate team ID
    const teamIdSchema = Joi.object({
      teamId: Joi.number().integer().positive().required(),
    });
    const teamIdError = validateJoiSchema(teamIdSchema, { teamId: parseInt(teamId) });
    if (teamIdError) throwError('Invalid team ID', HttpStatus.BAD_REQUEST, 'validationError');
    
    const validatedTeamId = parseInt(teamId);

    // Validate user ID
    const userIdSchema = Joi.object({
      userId: Joi.number().integer().positive().required(),
    });
    const userIdError = validateJoiSchema(userIdSchema, { userId });
    if (userIdError) throwError('Invalid user ID', HttpStatus.BAD_REQUEST, 'validationError');

    // Validate invitation data
    const invitationSchema = Joi.object({
      email: Joi.string().email().required().messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
      }),
      role: Joi.string().valid('OWNER', 'ADMIN', 'EDITOR', 'MEMBER', 'GUEST').required().messages({
        'any.only': 'Role must be one of: OWNER, ADMIN, EDITOR, MEMBER, GUEST',
        'any.required': 'Role is required',
      }),
    });

    const invitationError = validateJoiSchema(invitationSchema, data);
    if (invitationError) throwError(invitationError, HttpStatus.BAD_REQUEST, 'validationError');

    // Validate team exists and user has access
    const team = await teamRepository.findById(validatedTeamId);
    if (!team) {
      throwError('Team not found', HttpStatus.NOT_FOUND, 'teamNotFound');
    }

    const teamMember = await teamRepository.findTeamMember(validatedTeamId, userId);
    if (!teamMember) {
      throwError('Access denied', HttpStatus.FORBIDDEN, 'accessDenied');
  }

    // Check if user has permission to invite members
    if (!this.hasRolePermission(teamMember.role, 'ADMIN')) {
      throwError('Insufficient permissions to invite team members', HttpStatus.FORBIDDEN, 'insufficientPermissions');
    }

    return { teamId: validatedTeamId, validatedData: data, team };
  }

  async validateRemoveTeamMember(teamId: string, memberUserId: string, userId: number, teamRepository: any): Promise<{ teamId: number; memberUserId: number; team: any }> {
    // Validate team ID
    const teamIdSchema = Joi.object({
      teamId: Joi.number().integer().positive().required(),
    });
    const teamIdError = validateJoiSchema(teamIdSchema, { teamId: parseInt(teamId) });
    if (teamIdError) throwError('Invalid team ID', HttpStatus.BAD_REQUEST, 'validationError');
    
    const validatedTeamId = parseInt(teamId);

    // Validate member user ID
    const memberUserIdSchema = Joi.object({
      memberUserId: Joi.number().integer().positive().required(),
    });
    const memberUserIdError = validateJoiSchema(memberUserIdSchema, { memberUserId: parseInt(memberUserId) });
    if (memberUserIdError) throwError('Invalid member user ID', HttpStatus.BAD_REQUEST, 'validationError');
    
    const validatedMemberUserId = parseInt(memberUserId);

    // Validate user ID
    const userIdSchema = Joi.object({
      userId: Joi.number().integer().positive().required(),
    });
    const userIdError = validateJoiSchema(userIdSchema, { userId });
    if (userIdError) throwError('Invalid user ID', HttpStatus.BAD_REQUEST, 'validationError');

    // Validate team exists and user has access
    const team = await teamRepository.findById(validatedTeamId);
    if (!team) {
      throwError('Team not found', HttpStatus.NOT_FOUND, 'teamNotFound');
    }

    const teamMember = await teamRepository.findTeamMember(validatedTeamId, userId);
    if (!teamMember) {
      throwError('Access denied', HttpStatus.FORBIDDEN, 'accessDenied');
    }

    // Check if user has permission to remove members
    if (!this.hasRolePermission(teamMember.role, 'ADMIN')) {
      throwError('Insufficient permissions to remove team members', HttpStatus.FORBIDDEN, 'insufficientPermissions');
    }

    // Check if member exists
    const memberToRemove = await teamRepository.findTeamMember(validatedTeamId, validatedMemberUserId);
    if (!memberToRemove) {
      throwError('Team member not found', HttpStatus.NOT_FOUND, 'memberNotFound');
    }

    return { teamId: validatedTeamId, memberUserId: validatedMemberUserId, team };
  }

  async validateUpdateTeamMemberRole(teamId: string, memberUserId: string, userId: number, data: UpdateTeamMemberRoleDto, teamRepository: any): Promise<{ teamId: number; memberUserId: number; validatedData: UpdateTeamMemberRoleDto; team: any }> {
    // Validate team ID
    const teamIdSchema = Joi.object({
      teamId: Joi.number().integer().positive().required(),
    });
    const teamIdError = validateJoiSchema(teamIdSchema, { teamId: parseInt(teamId) });
    if (teamIdError) throwError('Invalid team ID', HttpStatus.BAD_REQUEST, 'validationError');
    
    const validatedTeamId = parseInt(teamId);

    // Validate member user ID
    const memberUserIdSchema = Joi.object({
      memberUserId: Joi.number().integer().positive().required(),
    });
    const memberUserIdError = validateJoiSchema(memberUserIdSchema, { memberUserId: parseInt(memberUserId) });
    if (memberUserIdError) throwError('Invalid member user ID', HttpStatus.BAD_REQUEST, 'validationError');
    
    const validatedMemberUserId = parseInt(memberUserId);

    // Validate user ID
    const userIdSchema = Joi.object({
      userId: Joi.number().integer().positive().required(),
    });
    const userIdError = validateJoiSchema(userIdSchema, { userId });
    if (userIdError) throwError('Invalid user ID', HttpStatus.BAD_REQUEST, 'validationError');

    // Validate role update data
    const roleSchema = Joi.object({
      role: Joi.string().valid('OWNER', 'ADMIN', 'EDITOR', 'MEMBER', 'GUEST').required().messages({
        'any.only': 'Role must be one of: OWNER, ADMIN, EDITOR, MEMBER, GUEST',
        'any.required': 'Role is required',
      }),
    });

    const roleError = validateJoiSchema(roleSchema, data);
    if (roleError) throwError(roleError, HttpStatus.BAD_REQUEST, 'validationError');

    // Validate team exists and user has access
    const team = await teamRepository.findById(validatedTeamId);
    if (!team) {
      throwError('Team not found', HttpStatus.NOT_FOUND, 'teamNotFound');
    }

    const teamMember = await teamRepository.findTeamMember(validatedTeamId, userId);
    if (!teamMember) {
      throwError('Access denied', HttpStatus.FORBIDDEN, 'accessDenied');
    }

    // Check if user has permission to update member roles
    if (!this.hasRolePermission(teamMember.role, 'ADMIN')) {
      throwError('Insufficient permissions to update team member roles', HttpStatus.FORBIDDEN, 'insufficientPermissions');
      }

    // Check if member exists
    const memberToUpdate = await teamRepository.findTeamMember(validatedTeamId, validatedMemberUserId);
    if (!memberToUpdate) {
      throwError('Team member not found', HttpStatus.NOT_FOUND, 'memberNotFound');
    }

    return { teamId: validatedTeamId, memberUserId: validatedMemberUserId, validatedData: data, team };
  }

  // UTILITY METHODS

  private hasRolePermission(userRole: string, requiredRole: string): boolean {
    const roleHierarchy = {
      'OWNER': 4,
      'ADMIN': 3,
      'EDITOR': 2,
      'MEMBER': 1,
      'GUEST': 0,
    };

    const userRoleLevel = (roleHierarchy as any)[userRole] || 0;
    const requiredRoleLevel = (roleHierarchy as any)[requiredRole] || 0;

    return userRoleLevel >= requiredRoleLevel;
  }
} 