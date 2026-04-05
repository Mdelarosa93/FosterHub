import { Body, Controller, Delete, Get, Param, Patch, Post, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { PermissionsGuard } from '../common/permissions.guard';
import { RequirePermissions } from '../common/permissions.decorator';
import { CurrentUser } from '../common/current-user.decorator';
import { KnowledgeBaseService } from './knowledge-base.service';
import { CreateKnowledgeDocumentSourceDto } from './dto/create-knowledge-document-source.dto';
import { UpdateKnowledgeDocumentSourceDto } from './dto/update-knowledge-document-source.dto';
import { ReplaceKnowledgeDocumentSectionsDto } from './dto/replace-knowledge-document-sections.dto';
import { ImportKnowledgeDocumentSectionsDto } from './dto/import-knowledge-document-sections.dto';

@Controller('knowledge-base')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class KnowledgeBaseController {
  constructor(private readonly knowledgeBaseService: KnowledgeBaseService) {}

  @Get('sources')
  @RequirePermissions('knowledge_sources.view')
  async listSources(@CurrentUser() user: any) {
    return { data: await this.knowledgeBaseService.listSources(user) };
  }

  @Post('sources')
  @RequirePermissions('knowledge_sources.manage')
  async createSource(@Body() body: CreateKnowledgeDocumentSourceDto, @CurrentUser() user: any) {
    return { data: await this.knowledgeBaseService.createSource(user, body) };
  }

  @Patch('sources/:sourceId')
  @RequirePermissions('knowledge_sources.manage')
  async updateSource(@Param('sourceId') sourceId: string, @Body() body: UpdateKnowledgeDocumentSourceDto, @CurrentUser() user: any) {
    return { data: await this.knowledgeBaseService.updateSource(sourceId, user, body) };
  }

  @Delete('sources/:sourceId')
  @RequirePermissions('knowledge_sources.manage')
  async deleteSource(@Param('sourceId') sourceId: string, @CurrentUser() user: any) {
    return { data: await this.knowledgeBaseService.deleteSource(sourceId, user) };
  }

  @Get('sources/:sourceId/file')
  @RequirePermissions('knowledge_sources.view')
  async getSourceFile(@Param('sourceId') sourceId: string, @CurrentUser() user: any, @Res() res: any) {
    const file = await this.knowledgeBaseService.getStoredFileForSource(sourceId, user);
    const fileStat = await stat(file.path);
    const encodedFileName = encodeURIComponent(file.fileName);

    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Content-Length', String(fileStat.size));
    res.setHeader('Content-Disposition', `attachment; filename="${file.fileName.replace(/"/g, '')}"; filename*=UTF-8''${encodedFileName}`);

    await pipeline(createReadStream(file.path), res);
  }

  @Get('sources/:sourceId/audit')
  @RequirePermissions('knowledge_sources.view')
  async listAudit(@Param('sourceId') sourceId: string, @CurrentUser() user: any) {
    return { data: await this.knowledgeBaseService.listAuditEvents(sourceId, user) };
  }

  @Get('sources/:sourceId/section-snapshots')
  @RequirePermissions('knowledge_sources.view')
  async listSectionSnapshots(@Param('sourceId') sourceId: string, @CurrentUser() user: any) {
    return { data: await this.knowledgeBaseService.listSectionSnapshots(sourceId, user) };
  }

  @Get('sources/:sourceId/section-snapshots/:snapshotId/compare')
  @RequirePermissions('knowledge_sources.view')
  async compareSnapshot(@Param('sourceId') sourceId: string, @Param('snapshotId') snapshotId: string, @CurrentUser() user: any) {
    return { data: await this.knowledgeBaseService.compareSnapshot(sourceId, snapshotId, user) };
  }

  @Post('sources/:sourceId/section-snapshots/:snapshotId/restore')
  @RequirePermissions('knowledge_sources.manage')
  async restoreSnapshot(@Param('sourceId') sourceId: string, @Param('snapshotId') snapshotId: string, @CurrentUser() user: any) {
    return { data: await this.knowledgeBaseService.restoreSnapshot(sourceId, snapshotId, user) };
  }

  @Get('sources/:sourceId/sections')
  @RequirePermissions('knowledge_sources.view')
  async listSections(@Param('sourceId') sourceId: string, @CurrentUser() user: any) {
    return { data: await this.knowledgeBaseService.listSections(sourceId, user) };
  }

  @Post('sources/:sourceId/sections/import-preview')
  @RequirePermissions('knowledge_sources.manage')
  async importPreview(@Param('sourceId') sourceId: string, @Body() body: ImportKnowledgeDocumentSectionsDto, @CurrentUser() user: any) {
    return { data: await this.knowledgeBaseService.previewImportedSections(sourceId, user, body.rawText) };
  }

  @Post('sources/:sourceId/sections/extract-preview')
  @RequirePermissions('knowledge_sources.manage')
  @UseInterceptors(FileInterceptor('file'))
  async extractPreview(@Param('sourceId') sourceId: string, @UploadedFile() file: any, @CurrentUser() user: any) {
    return { data: await this.knowledgeBaseService.previewExtractedSectionsFromFile(sourceId, user, file) };
  }

  @Post('sources/:sourceId/sections/replace')
  @RequirePermissions('knowledge_sources.manage')
  async replaceSections(@Param('sourceId') sourceId: string, @Body() body: ReplaceKnowledgeDocumentSectionsDto, @CurrentUser() user: any) {
    return { data: await this.knowledgeBaseService.replaceSections(sourceId, user, body) };
  }
}
