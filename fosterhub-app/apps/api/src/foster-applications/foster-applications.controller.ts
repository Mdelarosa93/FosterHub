import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { PermissionsGuard } from '../common/permissions.guard';
import { RequirePermissions } from '../common/permissions.decorator';
import { CurrentUser } from '../common/current-user.decorator';
import { FosterApplicationsService } from './foster-applications.service';

@Controller('foster-applications')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FosterApplicationsController {
  constructor(private readonly fosterApplicationsService: FosterApplicationsService) {}

  @Get()
  @RequirePermissions('applications.view')
  async list(@CurrentUser() user: any) {
    return { data: await this.fosterApplicationsService.list(user) };
  }

  @Get('assignable-users')
  @RequirePermissions('applications.view')
  async assignableUsers(@CurrentUser() user: any) {
    return { data: await this.fosterApplicationsService.assignableUsers(user) };
  }

  @Get('queue-summary')
  @RequirePermissions('applications.view')
  async queueSummary(@CurrentUser() user: any) {
    return { data: await this.fosterApplicationsService.queueSummary(user) };
  }

  @Get('reminders')
  @RequirePermissions('applications.view')
  async reminders(@CurrentUser() user: any) {
    return { data: await this.fosterApplicationsService.listReminders(user) };
  }

  @Post('reminders/sync')
  @RequirePermissions('applications.manage')
  async syncReminders(@CurrentUser() user: any) {
    return { data: await this.fosterApplicationsService.syncReminders(user) };
  }

  @Post('reminders/:reminderId/dismiss')
  @RequirePermissions('applications.manage')
  async dismissReminder(@CurrentUser() user: any, @Param('reminderId') reminderId: string) {
    return { data: await this.fosterApplicationsService.dismissReminder(user, reminderId) };
  }

  @Post()
  @RequirePermissions('applications.manage')
  async create(@CurrentUser() user: any, @Body() body: any) {
    return { data: await this.fosterApplicationsService.create(user, body) };
  }

  @Patch(':id')
  @RequirePermissions('applications.manage')
  async update(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return { data: await this.fosterApplicationsService.update(user, id, body) };
  }

  @Post('bulk-update')
  @RequirePermissions('applications.manage')
  async bulkUpdate(@CurrentUser() user: any, @Body() body: any) {
    return { data: await this.fosterApplicationsService.bulkUpdate(user, body) };
  }

  @Post('checklist-items/:checklistItemId/documents')
  @RequirePermissions('applications.manage')
  async attachChecklistDocument(@CurrentUser() user: any, @Param('checklistItemId') checklistItemId: string, @Body() body: any) {
    return { data: await this.fosterApplicationsService.attachChecklistDocument(user, checklistItemId, body) };
  }

  @Post(':id/convert-to-foster-parent')
  @RequirePermissions('applications.manage')
  async convertToFosterParent(@CurrentUser() user: any, @Param('id') id: string) {
    return { data: await this.fosterApplicationsService.convertToFosterParent(user, id) };
  }
}
