import { Controller, Get, UseGuards } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { PermissionsGuard } from '../common/permissions.guard';
import { RequirePermissions } from '../common/permissions.decorator';
import { CurrentUser } from '../common/current-user.decorator';

@Controller('organizations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get('tree')
  @RequirePermissions('organizations.view')
  async tree(@CurrentUser() user: any) {
    return { data: await this.organizationsService.tree(user) };
  }

  @Get('context')
  @RequirePermissions('organizations.view')
  async context(@CurrentUser() user: any) {
    return { data: await this.organizationsService.currentContext(user) };
  }
}
