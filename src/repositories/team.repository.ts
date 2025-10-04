import { Injectable } from '@nestjs/common';
import prisma from '../common/prisma';


@Injectable()
export class TeamRepository {
  async create(data: {
    name: string;
    description?: string;
    slug: string;
    isDefault?: boolean;
    isPublic?: boolean;
    createdBy: number;
  }): Promise<any> {
    return prisma.team.create({
      data: {
        name: data.name,
        description: data.description,
        slug: data.slug,
        isDefault: data.isDefault || false,
        isPublic: data.isPublic || false,
        createdBy: data.createdBy,
      },
    });
  }

  async findById(id: number): Promise<any> {
    return prisma.team.findUnique({
      where: { id },
      include: {
        createdByUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async findBySlug(slug: string): Promise<any> {
    return prisma.team.findUnique({
      where: { slug },
    });
  }

  async findUserTeams(userId: number): Promise<any[]> {
    return prisma.team.findMany({
      where: {
        teamMembers: {
          some: {
            userId,
            status: 'ACTIVE',
          },
        },
      },
      include: {
        teamMembers: {
          where: { userId },
          select: {
            role: true,
            status: true,
            joinedAt: true,
          },
        },
        _count: {
          select: {
            teamMembers: {
              where: { status: 'ACTIVE' },
            },
            teamApiKeys: {
              where: { isActive: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addMember(data: {
    teamId: number;
    userId: number;
    role: string;
    status: string;
    joinedAt: Date;
    invitedBy?: number;
  }): Promise<any> {
    return prisma.teamMember.create({
      data: {
        teamId: data.teamId,
        userId: data.userId,
        role: data.role as any,
        status: data.status as any,
        joinedAt: data.joinedAt,
        invitedBy: data.invitedBy,
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
        status: 'ACTIVE',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isEmailVerified: true,
          },
        },
        invitedByUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  async removeMember(teamId: number, userId: number): Promise<any> {
    return prisma.teamMember.update({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
      data: {
        status: 'LEFT',
        leftAt: new Date(),
      },
    });
  }

  async updateMemberRole(teamId: number, userId: number, role: string): Promise<any> {
    return prisma.teamMember.update({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
      data: {
        role: role as any,
      },
    });
  }

  async createInvitation(data: {
    teamId: number;
    email: string;
    role: string;
    createdBy: number;
    expiresAt: Date;
  }): Promise<any> {
    const token = this.generateInvitationToken();
    
    return prisma.teamInvitation.create({
      data: {
        teamId: data.teamId,
        email: data.email,
        role: data.role as any,
        token,
        createdBy: data.createdBy,
        expiresAt: data.expiresAt,
      },
    });
  }

  async findInvitationByToken(token: string): Promise<any> {
    return prisma.teamInvitation.findUnique({
      where: { token },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async markInvitationAsUsed(invitationId: number, usedBy: number): Promise<any> {
    return prisma.teamInvitation.update({
      where: { id: invitationId },
      data: {
        isUsed: true,
        usedAt: new Date(),
        usedBy,
      },
    });
  }

  async findPendingInvitations(teamId: number): Promise<any[]> {
    return prisma.teamInvitation.findMany({
      where: {
        teamId,
        isUsed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createTeamApiKey(data: {
    teamId: number;
    key: string;
    name: string;
    description?: string;
    scopes: string[];
    createdBy: number;
    expiresAt?: Date;
  }): Promise<any> {
    return prisma.teamApiKey.create({
      data: {
        teamId: data.teamId,
        key: data.key,
        name: data.name,
        description: data.description,
        scopes: data.scopes,
        createdBy: data.createdBy,
        expiresAt: data.expiresAt,
      },
    });
  }

  async findTeamApiKeys(teamId: number): Promise<any[]> {
    return prisma.teamApiKey.findMany({
      where: {
        teamId,
        isActive: true,
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findTeamApiKeyById(id: number): Promise<any> {
    return prisma.teamApiKey.findUnique({
      where: { id },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  async updateTeamApiKey(id: number, data: any): Promise<any> {
    return prisma.teamApiKey.update({
      where: { id },
      data,
    });
  }

  async deleteTeamApiKey(id: number): Promise<any> {
    return prisma.teamApiKey.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async createTeamActivity(data: {
    teamId: number;
    userId: number;
    action: string;
    resourceType?: string;
    resourceId?: number;
    details?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<any> {
    return prisma.teamActivity.create({
      data: {
        teamId: data.teamId,
        userId: data.userId,
        action: data.action,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        details: data.details,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  }

  async findTeamActivities(teamId: number, limit: number = 50): Promise<any[]> {
    return prisma.teamActivity.findMany({
      where: { teamId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
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

  private generateInvitationToken(): string {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }
} 