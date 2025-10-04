import { Module } from '@nestjs/common';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';
import { TeamsValidator } from './teams.validator';
import { TeamRepository } from '../../repositories/team.repository';
import { UserRepository } from '../../repositories/user.repository';

@Module({
  controllers: [TeamsController],
  providers: [TeamsService, TeamsValidator, TeamRepository, UserRepository],
  exports: [TeamsService],
})
export class TeamsModule {} 