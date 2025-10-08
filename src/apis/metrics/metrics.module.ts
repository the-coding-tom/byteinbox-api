import { Module } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';
import { MetricsValidator } from './metrics.validator';
import { RepositoriesModule } from '../../repositories/repositories.module';

@Module({
  imports: [RepositoriesModule],
  controllers: [MetricsController],
  providers: [MetricsService, MetricsValidator],
  exports: [MetricsService],
})
export class MetricsModule {}
