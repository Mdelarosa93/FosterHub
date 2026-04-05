import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { IntakeService } from './intake.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { PermissionsGuard } from '../common/permissions.guard';
import { RequirePermissions } from '../common/permissions.decorator';
import { CurrentUser } from '../common/current-user.decorator';
import { CreateIntakeDto } from './dto/create-intake.dto';

@Controller('intake-records')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class IntakeController {
  constructor(private readonly intakeService: IntakeService) {}

  @Get()
  @RequirePermissions('cases.view.all')
  async list(@CurrentUser() user: any) {
    return { data: await this.intakeService.list(user) };
  }

  @Post()
  @RequirePermissions('intake.create')
  async create(@Body() body: CreateIntakeDto, @CurrentUser() user: any) {
    return { data: await this.intakeService.create(body, user) };
  }

  @Post(':id/convert-to-case')
  @RequirePermissions('cases.edit')
  async convertToCase(@Param('id') id: string, @CurrentUser() user: any) {
    return { data: await this.intakeService.convertToCase(id, user) };
  }
}
