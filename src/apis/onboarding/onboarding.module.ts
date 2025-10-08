import { Module } from '@nestjs/common';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { OnboardingValidator } from './onboarding.validator';
import { RepositoriesModule } from '../../repositories/repositories.module';

@Module({
  imports: [RepositoriesModule],
  controllers: [OnboardingController],
  providers: [OnboardingService, OnboardingValidator],
  exports: [OnboardingService],
})
export class OnboardingModule {}
