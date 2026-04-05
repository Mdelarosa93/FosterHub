import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { PermissionsGuard } from '../common/permissions.guard';
import { RequirePermissions } from '../common/permissions.decorator';
import { CurrentUser } from '../common/current-user.decorator';
import { VendorsService } from './vendors.service';

@Controller('vendors')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get()
  @RequirePermissions('vendors.view')
  async list(@CurrentUser() user: any) {
    return { data: await this.vendorsService.list(user) };
  }

  @Post()
  @RequirePermissions('vendors.review')
  async create(@CurrentUser() user: any, @Body() body: any) {
    return { data: await this.vendorsService.create(user, body) };
  }
}
