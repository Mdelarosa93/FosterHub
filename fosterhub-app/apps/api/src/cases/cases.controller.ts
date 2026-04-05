import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CasesService } from './cases.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { PermissionsGuard } from '../common/permissions.guard';
import { RequirePermissions } from '../common/permissions.decorator';
import { CreateCaseRequestDto } from './dto/create-case-request.dto';
import { RequestDecisionDto } from './dto/request-decision.dto';
import { AssignWorkerDto } from './dto/assign-worker.dto';
import { CurrentUser } from '../common/current-user.decorator';

@Controller('cases')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Get()
  @RequirePermissions('cases.view.all')
  async list(@CurrentUser() user: any) {
    return { data: await this.casesService.list(user) };
  }

  @Get(':id')
  @RequirePermissions('cases.view.all')
  async getById(@Param('id') id: string, @CurrentUser() user: any) {
    return { data: await this.casesService.getById(id, user) };
  }

  @Post(':id/requests')
  @RequirePermissions('requests.submit')
  async createRequest(@Param('id') id: string, @Body() body: CreateCaseRequestDto, @CurrentUser() user: any) {
    return { data: await this.casesService.createRequest(id, body.title, body.description, user) };
  }

  @Post(':id/assign-worker')
  @RequirePermissions('cases.edit')
  async assignWorker(@Param('id') id: string, @Body() body: AssignWorkerDto, @CurrentUser() user: any) {
    return { data: await this.casesService.assignWorker(id, body.email, user) };
  }

  @Post('requests/:requestId/approve')
  @RequirePermissions('requests.approve')
  async approveRequest(@Param('requestId') requestId: string, @Body() body: RequestDecisionDto, @CurrentUser() user: any) {
    return { data: await this.casesService.updateRequestStatus(requestId, 'APPROVED', body.note, user) };
  }

  @Post('requests/:requestId/deny')
  @RequirePermissions('requests.approve')
  async denyRequest(@Param('requestId') requestId: string, @Body() body: RequestDecisionDto, @CurrentUser() user: any) {
    return { data: await this.casesService.updateRequestStatus(requestId, 'DENIED', body.note, user) };
  }
}
