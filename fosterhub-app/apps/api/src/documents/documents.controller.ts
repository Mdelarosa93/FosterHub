import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { PermissionsGuard } from '../common/permissions.guard';
import { RequirePermissions } from '../common/permissions.decorator';
import { CurrentUser } from '../common/current-user.decorator';
import { CreateDocumentDto } from './dto/create-document.dto';

@Controller('documents')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get('case/:caseId')
  @RequirePermissions('cases.view.all')
  async listByCase(@Param('caseId') caseId: string) {
    return { data: await this.documentsService.listByCase(caseId) };
  }

  @Post()
  @RequirePermissions('cases.edit')
  async create(@Body() body: CreateDocumentDto, @CurrentUser() user: any) {
    return { data: await this.documentsService.create(user.email, body) };
  }
}
