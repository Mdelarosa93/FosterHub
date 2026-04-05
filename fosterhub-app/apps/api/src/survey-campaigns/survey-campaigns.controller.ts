import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { PermissionsGuard } from '../common/permissions.guard';
import { RequirePermissions } from '../common/permissions.decorator';
import { CurrentUser } from '../common/current-user.decorator';
import { SurveyCampaignsService } from './survey-campaigns.service';

@Controller('survey-campaigns')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SurveyCampaignsController {
  constructor(private readonly surveyCampaignsService: SurveyCampaignsService) {}

  @Get()
  @RequirePermissions('surveys.view')
  async list(@CurrentUser() user: any) {
    return { data: await this.surveyCampaignsService.list(user) };
  }

  @Post()
  @RequirePermissions('surveys.manage')
  async create(@CurrentUser() user: any, @Body() body: any) {
    return { data: await this.surveyCampaignsService.create(user, body) };
  }
}
