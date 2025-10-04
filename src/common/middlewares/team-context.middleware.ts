import { Injectable, NestMiddleware, HttpStatus } from '@nestjs/common';
import { Response, NextFunction } from 'express';
import prisma from '../prisma';
import { throwError } from '../../utils/util';
import { logError } from '../../utils/logger';

@Injectable()
export class TeamContextMiddleware implements NestMiddleware {
  async use(req: any, res: Response, next: NextFunction) {
    try {
      const teamId = req.headers['x-team-id'] as string;

      if (teamId) {
        // Validate team exists
        const team = await prisma.team.findUnique({
          where: { id: parseInt(teamId) },
        });
        if (!team) {
          throwError('Team not found', HttpStatus.NOT_FOUND, 'teamNotFound');
        }

        // Verify user has access to this team
        const member = await prisma.teamMember.findFirst({
          where: {
            teamId: team!.id,
            userId: (req as any).user?.id,
            status: 'ACTIVE',
          },
        });
        if (!member) {
          throwError(
            'You do not have access to this team',
            HttpStatus.FORBIDDEN,
            'teamAccessDenied',
          );
        }

        // Attach team context to request
        req.teamContext = {
          teamId: team!.id.toString(),
          teamSlug: team!.slug,
          userRole: member!.role,
        };
      }

      next();
    } catch (error) {
      logError(`Unexpected error in team context middleware: ${error.message}`);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Internal server error',
        errorCode: 'serverError',
      });
    }
  }
}
