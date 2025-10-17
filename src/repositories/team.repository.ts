import { Injectable } from '@nestjs/common';
import { TeamInvitationStatus, ApiKeyStatus } from '@prisma/client';
import prisma from '../common/prisma';
import { TeamMemberRole } from '../common/enums/generic.enum';
import {
  CreateTeamData,
  AddTeamMemberData,
  CreateTeamInvitationData,
  CreateTeamApiKeyData,
} from './entities/team.entity';

@Injectable()
export class TeamRepository {
  // Note: description, isDefault, isPublic, createdBy fields removed from Team model
  async create(data: CreateTeamData): Promise<any> {
    return prisma.team.create({
      data: {
        name: data.name,
        slug: data.slug,
      },
    });
  }

  async findById(id: number): Promise<any> {
    return prisma.team.findUnique({
      where: { id },
    });
  }

  async findBySlug(slug: string): Promise<any> {
    return prisma.team.findFirst({
      where: { slug },
    });
  }

  async findUserTeams(userId: number): Promise<any[]> {
    return prisma.team.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: {
          where: { userId },
          select: {
            role: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            members: true,
            apiKeys: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Note: status, joinedAt, invitedBy fields removed from TeamMember model
  async addMember(data: AddTeamMemberData): Promise<any> {
    return prisma.teamMember.create({
      data: {
        teamId: data.teamId,
        userId: data.userId,
        role: data.role,
      },
    });
  }

  async findMember(teamId: number, userId: number): Promise<any> {
    return prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    });
  }

  async findTeamMembers(teamId: number): Promise<any[]> {
    return prisma.teamMember.findMany({
      where: {
        teamId,
      },
      include: {
        User: {
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true,
            emailVerifiedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async removeMember(teamId: number, userId: number): Promise<void> {
    // In new schema, we delete the member instead of marking as LEFT
    await prisma.teamMember.delete({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    });
  }

  async updateMemberRole(teamId: number, userId: number, role: TeamMemberRole): Promise<any> {
    return prisma.teamMember.update({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
      data: {
        role,
      },
    });
  }

  // Note: createdBy renamed to invitedBy in TeamInvitation
  async createInvitation(data: CreateTeamInvitationData): Promise<any> {
    const token = this.generateInvitationToken();

    return prisma.teamInvitation.create({
      data: {
        teamId: data.teamId,
        email: data.email,
        role: data.role,
        token,
        invitedBy: data.invitedBy,
        expiresAt: data.expiresAt,
      },
    });
  }

  async findInvitationByToken(token: string): Promise<any> {
    return prisma.teamInvitation.findUnique({
      where: { token },
      include: {
        Team: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  // Note: isUsed, usedAt, usedBy fields removed - using status and acceptedAt instead
  async markInvitationAsUsed(invitationId: number): Promise<any> {
    return prisma.teamInvitation.update({
      where: { id: invitationId },
      data: {
        status: TeamInvitationStatus.accepted,
        acceptedAt: new Date(),
      },
    });
  }

  async createTeamApiKey(data: CreateTeamApiKeyData): Promise<any> {
    return prisma.apiKey.create({
      data: {
        teamId: data.teamId,
        key: data.key,
        name: data.name,
        permission: data.permission,
        domain: data.domain,
        createdBy: data.createdBy,
        status: ApiKeyStatus.active,
      },
    });
  }

  async findTeamApiKeys(teamId: number): Promise<any[]> {
    return prisma.apiKey.findMany({
      where: {
        teamId,
        status: ApiKeyStatus.active,
      },
      include: {
        Creator: {
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: number, data: any): Promise<any> {
    return prisma.team.update({
      where: { id },
      data,
    });
  }

  async delete(id: number): Promise<any> {
    return prisma.team.delete({
      where: { id },
    });
  }

  /**
   * Find user's personal team (the team they own)
   */
  async findUserPersonalTeam(userId: number): Promise<any> {
    return prisma.team.findFirst({
      where: {
        members: {
          some: {
            userId: userId,
            role: TeamMemberRole.owner,
          },
        },
      },
    });
  }

  private generateInvitationToken(): string {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }
} 