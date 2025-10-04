import { Module } from '@nestjs/common';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { AccountValidator } from './account.validator';
import { UserRepository } from '../../repositories/user.repository';
import { SessionRepository } from '../../repositories/session.repository';

@Module({
  controllers: [AccountController],
  providers: [AccountService, AccountValidator, UserRepository, SessionRepository],
  exports: [AccountService],
})
export class AccountModule {} 