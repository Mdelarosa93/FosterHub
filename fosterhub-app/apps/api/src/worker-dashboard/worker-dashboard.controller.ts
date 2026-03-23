import { Controller, Get, UseGuards } from '@nestjs/common';
import { WorkerDashboardService } from './worker-dashboard.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { PermissionsGuard } from '../common/permissions.guard';
import { RequirePermissions } from '../common/permissions.decorator';
import { CurrentUser } from '../common/current-user.decorator';

@Controller('worker-dashboard')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class WorkerDashboardController {
  constructor(private readonly workerDashboardService: WorkerDashboardService) {}

  @Get('summary')
  @RequirePermissions('cases.view.assigned')
  async summary(@CurrentUser() user: any) {
    return { data: await this.workerDashboardService.summary(user) };
  }

  @Get('my-cases')
  @RequirePermissions('cases.view.assigned')
  async myCases(@CurrentUser() user: any) {
    return { data: await this.workerDashboardService.myCases(user) };
  }

  @Get('pending-requests')
  @RequirePermissions('requests.review')
  async pendingRequests() {
    return { data: await this.workerDashboardService.pendingRequests() };
  }
}
