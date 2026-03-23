import { Module } from '@nestjs/common';
import { WorkerDashboardController } from './worker-dashboard.controller';
import { WorkerDashboardService } from './worker-dashboard.service';

@Module({
  controllers: [WorkerDashboardController],
  providers: [WorkerDashboardService],
})
export class WorkerDashboardModule {}
